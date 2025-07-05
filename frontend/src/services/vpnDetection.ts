import AsyncStorage from "@react-native-async-storage/async-storage";

export interface VPNCheckResult {
  isVPN: boolean;
  provider?: string;
  country?: string;
}

class VPNDetectionService {
  private static instance: VPNDetectionService;
  private vpnCheckCache: Map<string, VPNCheckResult> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
  private lastCheckTime: number = 0;
  private readonly MIN_CHECK_INTERVAL = 30 * 1000; // 30 saniye

  static getInstance(): VPNDetectionService {
    if (!VPNDetectionService.instance) {
      VPNDetectionService.instance = new VPNDetectionService();
    }
    return VPNDetectionService.instance;
  }

  async checkVPNStatus(): Promise<VPNCheckResult> {
    try {
      // Rate limiting kontrolü
      const now = Date.now();
      if (now - this.lastCheckTime < this.MIN_CHECK_INTERVAL) {
        const cached = this.getCachedResult();
        if (cached) {
          return cached;
        }
      }

      this.lastCheckTime = now;

      // Cache kontrolü
      const cached = this.getCachedResult();
      if (cached) {
        return cached;
      }

      // IP adresi al
      const ipResponse = await fetch("https://api.ipify.org?format=json", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "InstagramClone/1.0",
        },
      });

      if (!ipResponse.ok) {
        throw new Error("IP adresi alınamadı");
      }

      const ipData = await ipResponse.json();
      const ip = ipData.ip;

      // VPN tespit API'si
      const vpnResponse = await fetch(`https://vpnapi.io/api/${ip}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "InstagramClone/1.0",
        },
      });

      if (!vpnResponse.ok) {
        throw new Error("VPN kontrolü yapılamadı");
      }

      const vpnData = await vpnResponse.json();

      const result: VPNCheckResult = {
        isVPN:
          vpnData.security?.vpn ||
          vpnData.security?.proxy ||
          vpnData.security?.tor ||
          false,
        provider: vpnData.security?.vpn
          ? "VPN Detected"
          : vpnData.security?.proxy
          ? "Proxy Detected"
          : vpnData.security?.tor
          ? "Tor Detected"
          : undefined,
        country: vpnData.location?.country || "Unknown",
      };

      // Sonucu cache'le
      this.cacheResult(result);

      // VPN tespit edildiyse log kaydet
      if (result.isVPN) {
        await this.logVPNAttempt(ip, result);
      }

      return result;
    } catch (error) {
      // Hata durumunda sessizce VPN olmadığını kabul et
      return { isVPN: false };
    }
  }

  private getCachedResult(): VPNCheckResult | null {
    const cached = this.vpnCheckCache.get("vpn_status");
    if (
      cached &&
      Date.now() - (cached as any).timestamp < this.CACHE_DURATION
    ) {
      return cached;
    }
    return null;
  }

  private cacheResult(result: VPNCheckResult): void {
    this.vpnCheckCache.set("vpn_status", {
      ...result,
      timestamp: Date.now(),
    } as any);
  }

  private async logVPNAttempt(
    ip: string,
    result: VPNCheckResult
  ): Promise<void> {
    try {
      const logs = (await AsyncStorage.getItem("vpn_attempts")) || "[]";
      const vpnLogs = JSON.parse(logs);

      vpnLogs.push({
        timestamp: Date.now(),
        ip,
        provider: result.provider,
        country: result.country,
        userAgent:
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : "React Native",
        deviceInfo: {
          platform: "React Native",
          timestamp: new Date().toISOString(),
        },
      });

      // Son 100 kaydı tut
      if (vpnLogs.length > 100) {
        vpnLogs.splice(0, vpnLogs.length - 100);
      }

      await AsyncStorage.setItem("vpn_attempts", JSON.stringify(vpnLogs));
    } catch (error) {
      console.error("VPN log kaydetme hatası:", error);
    }
  }

  async clearCache(): Promise<void> {
    this.vpnCheckCache.clear();
    this.lastCheckTime = 0; // Rate limiting'i de sıfırla
  }

  async getVPNAttempts(): Promise<any[]> {
    try {
      const logs = (await AsyncStorage.getItem("vpn_attempts")) || "[]";
      return JSON.parse(logs);
    } catch (error) {
      console.error("VPN logları okuma hatası:", error);
      return [];
    }
  }
}

export default VPNDetectionService.getInstance();
