/**
 * Firebase Security Wrapper
 * Provides secure wrappers for Firebase operations with validation
 */

import { validateApplicationId } from './security';
import { securityLogger } from './securityLogger';

/**
 * Secure Firebase reference creation
 * Validates path and prevents path traversal
 */
export function secureFirebaseRef(
  database: firebase.database.Database,
  path: string,
  id?: string
): firebase.database.Reference {
  // Whitelist allowed paths
  // Allow: 'applications' or 'applications/{userId}'
  const allowedPaths = ['applications'];
  const pathParts = path.split('/').filter(p => p.length > 0);

  const firstPathPart = pathParts[0];
  if (pathParts.length === 0 || !firstPathPart || !allowedPaths.includes(firstPathPart)) {
    const error = new Error(`Invalid Firebase path: ${path}`);
    securityLogger.log({
      type: 'injection_attempt',
      message: 'Attempted to access invalid Firebase path',
      details: { path, allowedPaths },
    });
    throw error;
  }

  // Validate user ID if present (second path part)
  // User IDs should be valid Firebase UIDs (alphanumeric, max 128 chars)
  if (pathParts.length >= 2) {
    const userId = pathParts[1];
    if (!userId || userId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      const error = new Error(`Invalid user ID in path: ${path}`);
      securityLogger.log({
        type: 'injection_attempt',
        message: 'Invalid user ID in Firebase path',
        details: { path, userId },
      });
      throw error;
    }
  }

  // If ID is provided, validate it
  if (id) {
    if (typeof id !== 'string') {
      const error = new Error('Invalid ID type');
      securityLogger.log({
        type: 'injection_attempt',
        message: 'Invalid ID type in Firebase path',
        details: { path, idType: typeof id },
      });
      throw error;
    }

    try {
      validateApplicationId(id);
    } catch (error) {
      securityLogger.log({
        type: 'injection_attempt',
        message: 'Invalid ID in Firebase path',
        details: { path, id },
      });
      throw error;
    }
  }

  // Construct safe path
  const safePath = id ? `${path}/${id}` : path;
  return database.ref(safePath);
}

/**
 * Secure Firebase update operation
 */
export async function secureFirebaseUpdate(
  database: firebase.database.Database,
  path: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const ref = secureFirebaseRef(database, path, id);
  return ref.update(data);
}

/**
 * Secure Firebase delete operation
 */
export async function secureFirebaseDelete(
  database: firebase.database.Database,
  path: string,
  id: string
): Promise<void> {
  const ref = secureFirebaseRef(database, path, id);
  return ref.remove();
}

/**
 * Secure Firebase read operation
 */
export async function secureFirebaseRead(
  database: firebase.database.Database,
  path: string,
  id?: string
): Promise<firebase.database.DataSnapshot> {
  const ref = secureFirebaseRef(database, path, id);
  return ref.once('value');
}
