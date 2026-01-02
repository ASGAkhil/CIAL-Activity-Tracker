
import { GoogleGenAI, Type } from "@google/genai";
import { User, Activity, UserRole } from '../types';
import { MOCK_INTERNS, MOCK_ADMIN, INITIAL_ACTIVITIES } from './mockData';
import { CONFIG } from './config';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

class InternApiService {
  private async fetchAllData(): Promise<{ interns: User[], activities: Activity[] }> {
    const sheetUrl = (CONFIG.GOOGLE_SHEET_API_URL || "").trim();
    const isMockMode = !sheetUrl || sheetUrl.includes("PASTE_YOUR_URL_HERE");

    if (!isMockMode) {
      try {
        console.log("📡 Syncing with Google Cloud...");
        
        // Use no-cache to ensure we get fresh data from the table
        const response = await fetch(sheetUrl, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error(`Cloud connection failed: ${response.status}`);
        }
        
        const json = await response.json();
        
        if (json.error) {
          console.error("❌ Apps Script Server Error:", json.error);
          throw new Error(`The spreadsheet script encountered an error: ${json.error}`);
        }

        let rawInterns = json.interns || [];
        let rawActivities = json.activities || [];

        // Helper to find a value by loosely matching keys (useful for Tables)
        const getValueByFuzzyKey = (obj: any, target: string) => {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const targetNorm = normalize(target);
          const key = Object.keys(obj).find(k => normalize(k).includes(targetNorm));
          return key ? obj[key] : null;
        };

        const remoteInterns = rawInterns
          .map((item: any, index: number) => {
            // Match against common header names used in the sheet screenshot
            const name = getValueByFuzzyKey(item, "Student Name") || getValueByFuzzyKey(item, "Full Name") || item["name"];
            const id = getValueByFuzzyKey(item, "Intern ID") || getValueByFuzzyKey(item, "ID");
            const status = getValueByFuzzyKey(item, "Status") || "Active";

            return {
              id: `sheet-${index}-${id}`,
              name: name ? String(name).trim() : "Unknown",
              internId: id ? String(id).trim().toUpperCase() : "",
              email: id ? `${String(id).toLowerCase()}@cial.org` : "unknown@cial.org",
              role: UserRole.INTERN,
              status: String(status).trim(),
              joiningDate: '2024-05-01'
            };
          })
          .filter((i: any) => 
            i.name !== "Unknown" && 
            i.internId !== "" && 
            i.status.toLowerCase().includes("active")
          );

        const remoteActivities = rawActivities.map((a: any) => ({
          ...a,
          hours: Number(a.hours || 0),
          qualityScore: Number(a.qualityScore || 5)
        }));

        console.log(`✅ Synced ${remoteInterns.length} interns and ${remoteActivities.length} logs.`);
        return { interns: remoteInterns, activities: remoteActivities };

      } catch (error: any) {
        console.error("❌ Sync Logic Error:", error.message);
        // Fallback to mock data so the app remains usable even if sync is broken
        return { interns: MOCK_INTERNS, activities: INITIAL_ACTIVITIES };
      }
    }

    return { interns: MOCK_INTERNS, activities: INITIAL_ACTIVITIES };
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
    const alreadySubmitted = currentActivities.find(a => a.date === activity.date);
    if (alreadySubmitted) throw new Error("A record for today already exists.");

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
        // Accessing response.text property directly as per SDK guidelines
        const jsonStr = response.text?.trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          qualityScore = parsed.score || 5;
        }
    } catch (e) {
      console.warn("AI scoring unavailable.");
    }

    const newActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      qualityScore
    };

    const sheetUrl = (CONFIG.GOOGLE_SHEET_API_URL || "").trim();
    if (sheetUrl && !sheetUrl.includes("PASTE_YOUR_URL_HERE")) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(newActivity)
        });
      } catch (err) {
        console.error("❌ Cloud Push Error:", err);
      }
    }

    return newActivity;
  }

  async getAllInterns(): Promise<User[]> {
    const { interns } = await this.fetchAllData();
    return interns;
  }
}

export const api = new InternApiService();
