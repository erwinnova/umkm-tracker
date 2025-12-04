import { ValueTransformer } from 'typeorm';

/**
 * Custom ValueTransformer for MariaDB spatial POINT data (SRID 4326)
 * Converts between:
 * - Database: Binary geometry format (Buffer)
 * - Application: Object with latitude and longitude
 */
export class SpatialPointTransformer implements ValueTransformer {
  /**
   * Convert from database value (Buffer) to application value (object)
   * MariaDB stores POINT as binary geometry format
   */
  to(value: Point | undefined): string | undefined {
    if (!value) return undefined;

    if (typeof value === 'string') {
      return value;
    }

    if (value.latitude !== undefined && value.longitude !== undefined) {
      // WKT format: POINT(longitude latitude)
      return `POINT(${value.longitude} ${value.latitude})`;
    }

    return undefined;
  }

  /**
   * Convert from application value (object) to database value (WKT string)
   * TypeORM passes the transformed value to the database
   */
  from(value: Buffer | string | undefined): Point | undefined {
    if (!value) return undefined;

    try {
      if (value instanceof Buffer) {
        // Parse binary geometry format (MariaDB/MySQL specific)
        // Skip WKB header (first 25 bytes contain SRID and type info)
        const coordinates = this.parseWKBPoint(value);
        return coordinates;
      }

      if (typeof value === 'string') {
        // Parse WKT format: POINT(longitude latitude)
        const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          return {
            latitude: parseFloat(match[2]),
            longitude: parseFloat(match[1]),
          };
        }
      }
    } catch (error) {
      console.error('Error parsing spatial data:', error);
    }

    return undefined;
  }

  /**
   * Parse WKB (Well-Known Binary) format for POINT geometry
   * MariaDB uses this internal binary format
   */
  private parseWKBPoint(buffer: Buffer): Point {
    // WKB Point format with SRID:
    // Bytes 0-3: Byte order (4 bytes)
    // Bytes 4-7: SRID (4 bytes, big-endian)
    // Bytes 8-9: Geometry type (2 bytes, little-endian)
    // Bytes 10-17: X coordinate (8 bytes, double)
    // Bytes 18-25: Y coordinate (8 bytes, double)

    try {
      // Read X (longitude) - offset 10
      const longitude = buffer.readDoubleLE(10);
      // Read Y (latitude) - offset 18
      const latitude = buffer.readDoubleLE(18);

      return { latitude, longitude };
    } catch (error) {
      console.error('Error parsing WKB point:', error);
      return { latitude: 0, longitude: 0 };
    }
  }
}

/**
 * Interface for spatial point coordinates
 */
export interface Point {
  latitude: number;
  longitude: number;
}
