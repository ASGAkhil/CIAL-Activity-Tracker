
import { User, UserRole, Activity, ActivityCategory } from '../types';

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  email: 'admin@internship.org',
  name: 'Program Director',
  role: UserRole.ADMIN,
  internId: 'ADM-001',
  joiningDate: '2024-01-01'
};

const generateMockInterns = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `intern-${i + 1}`,
    email: `intern${i + 1}@university.edu`,
    name: `Intern Name ${i + 1}`,
    role: UserRole.INTERN,
    internId: `INT-${1000 + i}`,
    joiningDate: '2024-05-01'
  }));
};

export const MOCK_INTERNS = generateMockInterns(185);

// Generating some realistic activity for the first few interns
const generateActivities = (internId: string): Activity[] => {
  const activities: Activity[] = [];
  const today = new Date();
  for (let i = 1; i <= 65; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    // Introduce some gaps for testing logic
    if (i % 15 === 0) continue; 
    
    activities.push({
      id: `act-${internId}-${i}`,
      internId,
      date: d.toISOString().split('T')[0],
      timestamp: d.toISOString(),
      hours: Math.random() > 0.3 ? 3 : 2,
      category: ActivityCategory.LEARNING,
      description: "Working on the core requirements and researching Google Sheets API integrations for our activity tracker project.",
      qualityScore: Math.floor(Math.random() * 5) + 5
    });
  }
  return activities;
};

export const INITIAL_ACTIVITIES: Activity[] = [
    ...generateActivities('INT-1000'),
    ...generateActivities('INT-1001'),
];
