# Testing Guide for v2.1.0

## ✅ Fixed Issues

1. **View Toggle Always Visible**
   - Moved view toggle outside applications section
   - Now accessible from all views (Cards/Table/Analytics)
   - Always visible at the top

2. **Analytics Dashboard Navigation**
   - Can switch back to Cards/Table from Analytics
   - Filters and sort controls hidden in Analytics view
   - View toggle always accessible

## 🧪 Testing Checklist

### View Mode Switching
- [ ] Switch from Cards → Table
- [ ] Switch from Table → Analytics
- [ ] Switch from Analytics → Cards
- [ ] Switch from Analytics → Table
- [ ] All transitions are smooth
- [ ] Active button is highlighted correctly

### Cards View
- [ ] Applications display as cards
- [ ] Pagination appears with 20+ applications
- [ ] Can navigate pages
- [ ] Edit/Delete buttons work
- [ ] Filters work
- [ ] Sorting works

### Table View
- [ ] Applications display in table format
- [ ] All columns visible (Company, Role, Date, Status, Visa, Actions)
- [ ] Table is scrollable on mobile
- [ ] Edit/Delete buttons work
- [ ] Pagination works
- [ ] Filters work
- [ ] Sorting works

### Analytics View
- [ ] Analytics dashboard displays
- [ ] Stat cards show correct metrics
- [ ] Status distribution chart renders
- [ ] Chart is interactive (hover tooltips)
- [ ] Insights display (if available)
- [ ] Can switch back to Cards/Table
- [ ] Filters are hidden (but still apply to analytics data)

### Pagination
- [ ] Appears when >20 applications
- [ ] Page numbers display correctly
- [ ] Previous/Next buttons work
- [ ] Can click page numbers
- [ ] Current page is highlighted
- [ ] Page info shows correct counts

### With 100+ Applications
- [ ] Table view is readable
- [ ] Cards view has pagination
- [ ] Performance is acceptable
- [ ] No lag when switching views
- [ ] Filters work quickly

### Responsive Design
- [ ] View toggle works on mobile
- [ ] Table view is scrollable on mobile
- [ ] Charts are responsive
- [ ] Stat cards stack on mobile

## 🐛 Known Issues to Check

1. **Chart Rendering**
   - Does chart appear on first load?
   - Does chart update when switching views?
   - Does chart respect filters?

2. **State Persistence**
   - Does view mode persist on page reload?
   - Do filters persist?
   - Does pagination reset correctly?

3. **Edge Cases**
   - Empty state (no applications)
   - Single application
   - Exactly 20 applications (pagination boundary)
   - Very long company/role names

## 📝 Test Results

Document any issues found here:

### Issues Found:
- 

### Working Well:
- 

---

**Test Date**: 
**Tester**: 
**Version**: 2.1.0
