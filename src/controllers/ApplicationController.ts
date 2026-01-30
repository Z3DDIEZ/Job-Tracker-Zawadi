import { JobApplication, ApplicationStatus, Tag } from '../types';
import { authService } from '../services/authService';
import { eventTrackingService } from '../services/eventTracking';
import { CacheManager } from '../utils/cache';
import { rateLimiter } from '../utils/security';
import { securityLogger } from '../utils/securityLogger';
import {
    secureFirebaseRef,
    secureFirebaseUpdate,
    secureFirebaseDelete,
    secureFirebaseRead,
    getUserApplicationsPath,
} from '../utils/firebaseSecurity';
import { validateApplicationId } from '../utils/security';

export class ApplicationController {
    constructor(private database: firebase.database.Database) { }

    /**
     * Add a new job application
     */
    async addApplication(
        company: string,
        role: string,
        dateApplied: string,
        status: ApplicationStatus,
        visaSponsorship: boolean,
        tags?: Tag[]
    ): Promise<void> {
        // Rate limiting check
        if (!rateLimiter.isAllowed('add-application')) {
            securityLogger.log({
                type: 'rate_limited',
                message: 'Rate limit exceeded for add-application',
                details: { operation: 'add-application' },
            });
            throw new Error('Too many requests. Please wait a moment before adding another application.');
        }

        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Please sign in to add applications.');
        }

        const userPath = getUserApplicationsPath(user.uid);
        const newApplicationRef = secureFirebaseRef(this.database, userPath).push();

        const applicationData: JobApplication = {
            company,
            role,
            dateApplied,
            status,
            visaSponsorship,
            timestamp: Date.now(),
            id: newApplicationRef.key || '',
            tags: tags && tags.length > 0 ? tags : undefined,
        };

        try {
            await newApplicationRef.set(applicationData);

            eventTrackingService.track('application_added', {
                company,
                status,
                visaSponsorship,
            });

            CacheManager.invalidate();
        } catch (error) {
            console.error('❌ Error saving application:', error);
            throw error;
        }
    }

    /**
     * Update an existing application
     */
    async updateApplication(
        id: string,
        data: {
            company: string;
            role: string;
            dateApplied: string;
            status: ApplicationStatus;
            visaSponsorship: boolean;
        },
        originalStatus?: ApplicationStatus
    ): Promise<void> {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Please sign in to update applications.');
        }

        const updatedData = {
            ...data,
            updatedAt: Date.now(),
        };

        const userPath = getUserApplicationsPath(user.uid);

        try {
            await secureFirebaseUpdate(this.database, userPath, id, updatedData);

            // Track status changes
            if (originalStatus && originalStatus !== data.status) {
                eventTrackingService.track('status_changed', {
                    applicationId: id,
                    fromStatus: originalStatus,
                    toStatus: data.status,
                });
            }

            eventTrackingService.track('application_updated', {
                applicationId: id,
                company: data.company,
            });

            CacheManager.invalidate();
        } catch (error) {
            console.error('❌ Error updating application:', error);

            securityLogger.log({
                type: 'unauthorized_access',
                message: 'Failed to update application',
                details: { operation: 'update-application', id, error: String(error).substring(0, 100) },
            });

            throw error;
        }
    }

    /**
     * Delete an application
     */
    async deleteApplication(id: string): Promise<JobApplication> {
        // Validate ID
        try {
            validateApplicationId(id);
        } catch (error) {
            console.error('Security: Invalid ID attempted:', error);
            throw new Error('Invalid application ID.');
        }

        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Please sign in to delete applications.');
        }

        // Rate limiting
        if (!rateLimiter.isAllowed(`delete-application:${user.uid}`)) {
            throw new Error('Too many requests. Please wait a moment before deleting again.');
        }

        const userPath = getUserApplicationsPath(user.uid);

        // Secure read before delete to get details (and verify existence/ownership)
        const snapshot = await secureFirebaseRead(this.database, userPath, id);
        const app = snapshot.val() as JobApplication | null;

        if (!app) {
            throw new Error('Application not found!');
        }

        await secureFirebaseDelete(this.database, userPath, id);

        eventTrackingService.track('application_deleted', {
            applicationId: id,
            company: app.company,
        });

        CacheManager.invalidate();

        return app;
    }

    /**
     * Get a single application by ID
     */
    async getApplication(id: string): Promise<JobApplication | null> {
        const user = authService.getCurrentUser();
        if (!user) return null;

        const userPath = getUserApplicationsPath(user.uid);
        const snapshot = await secureFirebaseRead(this.database, userPath, id);
        return snapshot.val() as JobApplication | null;
    }

    /**
     * Subscribe to applications updates
     */
    subscribeToApplications(callback: (apps: JobApplication[]) => void): () => void {
        const user = authService.getCurrentUser();
        if (!user) {
            callback([]);
            return () => { };
        }

        const userPath = getUserApplicationsPath(user.uid);
        const ref = secureFirebaseRef(this.database, userPath);

        const onValueChange = (snapshot: firebase.database.DataSnapshot) => {
            const data = snapshot.val() as Record<string, JobApplication> | null;
            if (!data) {
                callback([]);
                return;
            }
            // Convert object to array
            const apps = Object.values(data);
            callback(apps);
        };

        ref.on('value', onValueChange);

        // Return unsubscribe function
        return () => ref.off('value', onValueChange);
    }

    /**
     * Bulk import applications
     */
    async importApplications(applications: JobApplication[]): Promise<{ added: number; skipped: number; errors: number }> {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userPath = getUserApplicationsPath(user.uid);

        // 1. Fetch existing applications
        const snapshot = await secureFirebaseRead(this.database, userPath, ''); // Read all
        const existingData = snapshot.val() as Record<string, JobApplication> | null;
        const existingApps = existingData ? Object.values(existingData) : [];

        // 2. Filter duplicates
        const newApplications = applications.filter(app => {
            const isDuplicate = existingApps.some(existing =>
                (existing.company || '').toLowerCase().trim() === (app.company || '').toLowerCase().trim() &&
                (existing.role || '').toLowerCase().trim() === (app.role || '').toLowerCase().trim() &&
                existing.dateApplied === app.dateApplied
            );
            return !isDuplicate;
        });

        if (newApplications.length === 0) {
            return { added: 0, skipped: applications.length, errors: 0 };
        }

        // 3. Prepare updates
        const updates: Record<string, any> = {};
        newApplications.forEach(app => {
            // Generate new ID if needed or use existing if it's unique
            const newRef = secureFirebaseRef(this.database, userPath).push();
            const id = newRef.key || app.id; // Fallback to provided ID? Better to use new key to avoid collisions if not preserving IDs.
            // Actually main.ts was generating new IDs.

            updates[id] = {
                ...app,
                id,
                timestamp: Date.now()
            };
        });

        // 4. Save
        await secureFirebaseUpdate(this.database, userPath, '', updates);

        CacheManager.invalidate(); // Ensure cache is refreshed

        return {
            added: newApplications.length,
            skipped: applications.length - newApplications.length,
            errors: 0
        };
    }
}
