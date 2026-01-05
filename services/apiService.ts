
import { GoogleGenAI, Type } from "@google/genai";
import { User, Activity, UserRole } from '../types';
import { MOCK_INTERNS, MOCK_ADMIN, INITIAL_ACTIVITIES } from './mockData';
import { CONFIG } from './config';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

class InternApiService {
  private CACHE_INTERNS = 'cial_vault_interns';
  private CACHE_ACTIVITIES = 'cial_vault_activities';

  private async fetchAllData(): Promise<{ interns: User[], activities: Activity[] }> {
    const sheetUrl = (CONFIG.GOOGLE_SHEET_API_URL || "").trim();
    const isMockMode = !sheetUrl || sheetUrl.includes("PASTE_YOUR_URL_HERE");

    // Pre-load from cache for safety
    const cachedInterns = localStorage.getItem(this.CACHE_INTERNS);
    const cachedActivities = localStorage.getItem(this.CACHE_ACTIVITIES);
    
    let interns = cachedInterns ? JSON.parse(cachedInterns) : MOCK_INTERNS;
    let activities = cachedActivities ? JSON.parse(cachedActivities) : INITIAL_ACTIVITIES;

    if (!isMockMode) {
      try {
        const response = await fetch(sheetUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Cloud Sync failed`);
        
        const json = await response.json();
        if (json.error) throw new Error(json.error);

        const getValueByFuzzyKey = (obj: any, target: string) => {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const targetNorm = normalize(target);
          const key = Object.keys(obj).find(k => normalize(k).includes(targetNorm));
          return key ? obj[key] : null;
        };

        if (json.interns && json.interns.length > 0) {
          const remoteInterns = json.interns.map((item: any, index: number) => {
            const name = getValueByFuzzyKey(item, "Student Name") || getValueByFuzzyKey(item, "Full Name") || item["name"];
            const id = getValueByFuzzyKey(item, "Intern ID") || getValueByFuzzyKey(item, "ID");
            return {
              id: `sheet-${index}-${id}`,
              name: name ? String(name).trim() : "Unknown",
              internId: id ? String(id).trim().toUpperCase() : "",
              email: id ? `${String(id).toLowerCase()}@cial.org` : "unknown@cial.org",
              role: UserRole.INTERN,
              joiningDate: '2024-05-01'
            };
          }).filter((i: any) => i.internId !== "");

          if (remoteInterns.length > 0) {
            interns = remoteInterns;
            localStorage.setItem(this.CACHE_INTERNS, JSON.stringify(interns));
          }
        }

        if (json.activities && json.activities.length >= 0) {
          const remoteActivities = json.activities.map((a: any) => ({
            ...a,
            hours: Number(a.hours || 0),
            qualityScore: Number(a.qualityScore || 5)
          }));
          
          // Only overwrite if we actually got valid results back to prevent "vanishing"
          if (json.activities.length > 0) {
            activities = remoteActivities;
            localStorage.setItem(this.CACHE_ACTIVITIES, JSON.stringify(activities));
          }
        }

      } catch (error: any) {
        console.warn("⚠️ Cloud connection failed. Using local vault data.", error.message);
      }
    }

    return { interns, activities };
  }

  async getInternDirectory(): Promise<{ name: string; id: string }[]> {
    const { interns } = await this.fetchAllData();
    const list = interns.map(i => ({ name: i.name, id: i.internId }));
    if (!list.find(i => i.id === MOCK_ADMIN.internId)) {
      list.unshift({ name: MOCK_ADMIN.name, id: MOCK_ADMIN.internId });
    }
    return list;
  }

  async loginByName(name: string, internId: string): Promise<User | null> {
    const normalizedId = internId.toUpperCase().trim();
    if (normalizedId === MOCK_ADMIN.internId) return MOCK_ADMIN;
    const { interns } = await this.fetchAllData();
    return interns.find(u => u.internId.toUpperCase() === normalizedId) || null;
  }

  async getActivities(internId?: string): Promise<Activity[]> {
    const { activities } = await this.fetchAllData();
    if (internId) return activities.filter(a => a.internId === internId);
    return activities;
  }

  async submitActivity(activity: Omit<Activity, 'id' | 'timestamp' | 'qualityScore'>): Promise<Activity> {
    const currentActivities = await this.getActivities(activity.internId);
    if (currentActivities.find(a => a.date === activity.date)) throw new Error("A record for today already exists.");

    let qualityScore = 5;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Rate the following work description on a scale of 1-10: "${activity.description}"`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { score: { type: Type.NUMBER } },
                    required: ["score"]
                }
            }
        });
        const jsonStr = response.text?.trim();
        if (jsonStr) qualityScore = JSON.parse(jsonStr).score || 5;
    } catch (e) {}

    const newActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      qualityScore
    };

    // Save locally immediately to prevent loss
    const stored = localStorage.getItem(this.CACHE_ACTIVITIES);
    const list = stored ? JSON.parse(stored) : [];
    list.push(newActivity);
    localStorage.setItem(this.CACHE_ACTIVITIES, JSON.stringify(list));

    const sheetUrl = (CONFIG.GOOGLE_SHEET_API_URL || "").trim();
    if (sheetUrl && !sheetUrl.includes("PASTE_YOUR_URL_HERE")) {
      fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(newActivity)
      }).catch(err => console.error("Cloud Push Failed:", err));
    }

    return newActivity;
  }

  async getAllInterns(): Promise<User[]> {
    const { interns } = await this.fetchAllData();
    return interns;
  }
}

export const api = new InternApiService();
