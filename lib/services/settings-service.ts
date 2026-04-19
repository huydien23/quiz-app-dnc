import { ref, get, set, update } from "firebase/database"
import { database } from "@/lib/firebase"
import type { SystemSetting, DEFAULT_SETTINGS } from "@/lib/types"

export class SettingsService {
    private static readonly PATH = "settings"

    // Get all settings
    static async getAllSettings(): Promise<Record<string, SystemSetting>> {
        try {
            const settingsRef = ref(database, this.PATH)
            const snapshot = await get(settingsRef)

            // Import default settings
            const { DEFAULT_SETTINGS } = await import('@/lib/types')

            if (!snapshot.exists()) {
                // Return defaults if no settings exist
                return { ...DEFAULT_SETTINGS }
            }

            const stored = snapshot.val() as Record<string, SystemSetting>

            // Merge with defaults (in case new settings were added)
            return { ...DEFAULT_SETTINGS, ...stored }
        } catch (error) {
            console.error('Error getting settings:', error)
            const { DEFAULT_SETTINGS } = await import('@/lib/types')
            return { ...DEFAULT_SETTINGS }
        }
    }

    // Get a single setting value
    static async getSetting<T = any>(key: string): Promise<T | null> {
        try {
            const settings = await this.getAllSettings()
            const setting = settings[key]
            return setting ? setting.value as T : null
        } catch (error) {
            console.error('Error getting setting:', error)
            return null
        }
    }

    // Get a setting with default fallback
    static async getSettingWithDefault<T = any>(key: string, defaultValue: T): Promise<T> {
        const value = await this.getSetting<T>(key)
        return value !== null ? value : defaultValue
    }

    // Update a setting
    static async updateSetting(
        key: string,
        value: any,
        updatedBy: string
    ): Promise<void> {
        try {
            const settingRef = ref(database, `${this.PATH}/${key}`)
            const existing = await this.getSetting(key)

            if (existing === null) {
                // Get default setting info if exists
                const { DEFAULT_SETTINGS } = await import('@/lib/types')
                const defaultSetting = DEFAULT_SETTINGS[key]

                if (!defaultSetting) {
                    console.warn(`Unknown setting key: ${key}`)
                }

                await set(settingRef, {
                    key,
                    value,
                    description: defaultSetting?.description || key,
                    type: defaultSetting?.type || typeof value,
                    category: defaultSetting?.category || 'general',
                    updatedAt: new Date().toISOString(),
                    updatedBy
                })
            } else {
                await update(settingRef, {
                    value,
                    updatedAt: new Date().toISOString(),
                    updatedBy
                })
            }
        } catch (error) {
            console.error('Error updating setting:', error)
            throw error
        }
    }

    // Update multiple settings at once
    static async updateSettings(
        settings: Record<string, any>,
        updatedBy: string
    ): Promise<void> {
        try {
            const updates = Object.entries(settings).map(([key, value]) =>
                this.updateSetting(key, value, updatedBy)
            )
            await Promise.all(updates)
        } catch (error) {
            console.error('Error updating settings:', error)
            throw error
        }
    }

    // Reset setting to default
    static async resetSetting(key: string, updatedBy: string): Promise<void> {
        try {
            const { DEFAULT_SETTINGS } = await import('@/lib/types')
            const defaultSetting = DEFAULT_SETTINGS[key]

            if (!defaultSetting) {
                throw new Error(`No default value for setting: ${key}`)
            }

            await this.updateSetting(key, defaultSetting.value, updatedBy)
        } catch (error) {
            console.error('Error resetting setting:', error)
            throw error
        }
    }

    // Reset all settings to defaults
    static async resetAllSettings(updatedBy: string): Promise<void> {
        try {
            const { DEFAULT_SETTINGS } = await import('@/lib/types')

            const updates = Object.entries(DEFAULT_SETTINGS).map(([key, setting]) =>
                this.updateSetting(key, setting.value, updatedBy)
            )

            await Promise.all(updates)
        } catch (error) {
            console.error('Error resetting all settings:', error)
            throw error
        }
    }

    // Get settings by category
    static async getSettingsByCategory(category: string): Promise<Record<string, SystemSetting>> {
        try {
            const allSettings = await this.getAllSettings()

            return Object.fromEntries(
                Object.entries(allSettings).filter(([_, setting]) => setting.category === category)
            )
        } catch (error) {
            console.error('Error getting settings by category:', error)
            return {}
        }
    }

    // Helper: Check if feature is enabled
    static async isFeatureEnabled(featureKey: string): Promise<boolean> {
        return this.getSettingWithDefault(featureKey, false)
    }

    // Get common settings
    static async getCommonSettings(): Promise<{
        siteName: string
        allowRegistration: boolean
        defaultTimeLimit: number
        enableLeaderboard: boolean
        enableAchievements: boolean
        requireCommentApproval: boolean
    }> {
        try {
            const settings = await this.getAllSettings()

            return {
                siteName: settings.site_name?.value || 'Quiz App',
                allowRegistration: settings.allow_registration?.value ?? true,
                defaultTimeLimit: settings.default_time_limit?.value || 30,
                enableLeaderboard: settings.enable_leaderboard?.value ?? true,
                enableAchievements: settings.enable_achievements?.value ?? true,
                requireCommentApproval: settings.require_comment_approval?.value ?? true
            }
        } catch (error) {
            console.error('Error getting common settings:', error)
            return {
                siteName: 'Quiz App',
                allowRegistration: true,
                defaultTimeLimit: 30,
                enableLeaderboard: true,
                enableAchievements: true,
                requireCommentApproval: true
            }
        }
    }
}
