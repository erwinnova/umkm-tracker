import { ValueTransformer } from 'typeorm';

/**
 * Custom ValueTransformer for MariaDB spatial POINT data (SRID 4326)
 * Converts between:
 * - Database: Binary geometry format (Buffer)
 * - Application: Object with latitude and longitude
 *
 * Note: MariaDB returns spatial data as binary by default.
 * We convert it to/from a Point object for easier handling.
 */
export class SpatialPointTransformer implements ValueTransformer {
  /**
   * Convert from application value (object) to database value (WKT string)
   * Called when saving to database
   */
  to(value: Point | undefined | null): string | undefined {
    if (!value) return undefined;

    if (typeof value === 'string') {
      return value;
    }

    if (value.latitude !== undefined && value.longitude !== undefined) {
      // WKT format: POINT(longitude latitude)
      // MariaDB will convert this to binary internally
      return `POINT(${value.longitude} ${value.latitude})`;
    }

    return undefined;
  }

  /**
   * Convert from database value (Buffer) to application value (object)
   * Called when reading from database
   * MariaDB returns spatial data as binary WKB format
   */
  from(value: Buffer | string | undefined | null): Point | undefined {
    if (!value) return undefined;

    try {
      if (value instanceof Buffer) {
        // Parse binary geometry format (WKB - Well-Known Binary)
        // MariaDB stores POINT as binary geometry format
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
      return undefined;
    }

    return undefined;
  }

  /**
   * Parse WKB (Well-Known Binary) format for POINT geometry
   * MariaDB uses this internal binary format for spatial columns
   *
   * WKB POINT format (with SRID):
   * - Byte order (1 byte): 0x01 (little-endian)
   * - SRID (4 bytes): little-endian integer (0x20000000 flag + SRID value)
   * - Type (4 bytes): 0x01000000 (little-endian, POINT type)
   * - X coordinate (8 bytes): IEEE 754 double (little-endian)
   * - Y coordinate (8 bytes): IEEE 754 double (little-endian)
   *
   * Total: 25 bytes minimum
   */
  private parseWKBPoint(buffer: Buffer): Point | undefined {
    try {
      // Minimum buffer size for POINT with SRID
      if (buffer.length < 25) {
        console.warn(`Buffer too small for WKB POINT: ${buffer.length} bytes`);
        return undefined;
      }

      // Check byte order (little-endian: 0x01)
      const byteOrder = buffer.readUInt8(0);
      if (byteOrder !== 0x01) {
        console.warn(`Unexpected byte order: 0x${byteOrder.toString(16)}`);
        return undefined;
      }

      // Read X (longitude) - offset 9 (after SRID header)
      const longitude = buffer.readDoubleLE(9);
      // Read Y (latitude) - offset 17 (after X coordinate)
      const latitude = buffer.readDoubleLE(17);

      // Validate coordinates are within expected ranges
      if (
        isNaN(longitude) ||
        isNaN(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        console.warn(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
        return undefined;
      }

      return { latitude, longitude };
    } catch (error) {
      console.error('Error parsing WKB point:', error);
      return undefined;
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
