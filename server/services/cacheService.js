import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '../../cache');

class CacheService {
  constructor() {
    this.ensureCacheDir();
  }

  /**
   * 캐시 디렉토리 생성
   */
  async ensureCacheDir() {
    try {
      await fs.access(CACHE_DIR);
    } catch {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      console.log('[Cache] 캐시 디렉토리 생성:', CACHE_DIR);
    }
  }

  /**
   * 캐시 파일 경로 생성
   */
  getCachePath(key) {
    return path.join(CACHE_DIR, `${key}.json`);
  }

  /**
   * 캐시 읽기
   * @param {string} key - 캐시 키
   * @param {number} ttl - TTL (초 단위, 0 = 무제한)
   * @returns {Promise<any|null>} 캐시된 데이터 또는 null
   */
  async get(key, ttl = 0) {
    try {
      const cachePath = this.getCachePath(key);
      const cacheData = await fs.readFile(cachePath, 'utf-8');
      const parsed = JSON.parse(cacheData);

      // TTL 체크
      if (ttl > 0) {
        const now = Date.now();
        const cacheAge = (now - parsed.timestamp) / 1000; // 초 단위

        if (cacheAge > ttl) {
          console.log(`[Cache] ${key} 만료됨 (${Math.floor(cacheAge)}초 경과, TTL: ${ttl}초)`);
          return null;
        }

        console.log(`[Cache] ${key} 히트 (캐시 나이: ${Math.floor(cacheAge)}초)`);
      } else {
        console.log(`[Cache] ${key} 히트 (무제한 캐시)`);
      }

      return parsed.data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`[Cache] ${key} 미스 (파일 없음)`);
      } else {
        console.warn(`[Cache] ${key} 읽기 실패:`, error.message);
      }
      return null;
    }
  }

  /**
   * 캐시 저장
   * @param {string} key - 캐시 키
   * @param {any} data - 저장할 데이터
   */
  async set(key, data) {
    try {
      await this.ensureCacheDir();
      const cachePath = this.getCachePath(key);

      const cacheData = {
        timestamp: Date.now(),
        key: key,
        data: data
      };

      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
      console.log(`[Cache] ${key} 저장 완료 (${(JSON.stringify(cacheData).length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`[Cache] ${key} 저장 실패:`, error.message);
    }
  }

  /**
   * 캐시 삭제
   * @param {string} key - 캐시 키
   */
  async delete(key) {
    try {
      const cachePath = this.getCachePath(key);
      await fs.unlink(cachePath);
      console.log(`[Cache] ${key} 삭제 완료`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[Cache] ${key} 삭제 실패:`, error.message);
      }
      return false;
    }
  }

  /**
   * 모든 캐시 삭제
   */
  async clear() {
    try {
      const files = await fs.readdir(CACHE_DIR);
      let deleted = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(CACHE_DIR, file));
          deleted++;
        }
      }

      console.log(`[Cache] ${deleted}개 캐시 파일 삭제 완료`);
      return deleted;
    } catch (error) {
      console.error('[Cache] 전체 삭제 실패:', error.message);
      return 0;
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getStats() {
    try {
      const files = await fs.readdir(CACHE_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      let totalSize = 0;
      const cacheInfo = [];

      for (const file of jsonFiles) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);

        totalSize += stats.size;
        cacheInfo.push({
          key: file.replace('.json', ''),
          size: stats.size,
          created: new Date(parsed.timestamp),
          age_seconds: Math.floor((Date.now() - parsed.timestamp) / 1000)
        });
      }

      return {
        total_files: jsonFiles.length,
        total_size_kb: (totalSize / 1024).toFixed(2),
        cache_dir: CACHE_DIR,
        files: cacheInfo
      };
    } catch (error) {
      console.error('[Cache] 통계 조회 실패:', error.message);
      return {
        total_files: 0,
        total_size_kb: 0,
        cache_dir: CACHE_DIR,
        files: []
      };
    }
  }

  /**
   * 경기 상태에 따른 TTL 계산
   * @param {string} status - 경기 상태 (NS, 1H, HT, 2H, FT)
   * @param {string} matchDate - 경기 날짜 (ISO 8601)
   * @returns {number} TTL (초 단위)
   */
  calculateFixtureTTL(status, matchDate) {
    // 경기 종료: 무제한 캐시 (경기 결과는 변하지 않음)
    if (status === 'FT' || status === 'AET' || status === 'PEN') {
      return 0; // 무제한
    }

    // 경기 중: 5분 캐시
    if (status === '1H' || status === 'HT' || status === '2H') {
      return 5 * 60; // 5분
    }

    // 경기 시작 전
    const now = new Date();
    const matchTime = new Date(matchDate);
    const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);

    if (hoursUntilMatch < 0) {
      // 경기 시간 지났는데 NS 상태: 5분 캐시 (경기 시작 확인)
      return 5 * 60;
    } else if (hoursUntilMatch < 24) {
      // 24시간 이내: 1시간 캐시
      return 60 * 60;
    } else {
      // 24시간 이상: 1일 캐시
      return 24 * 60 * 60;
    }
  }
}

export default new CacheService();
