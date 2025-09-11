import { Controller, Get, Query } from '@nestjs/common';

@Controller('geocode')
export class GeocodeController {
  @Get('reverse')
  async reverse(@Query('lat') latStr?: string, @Query('lng') lngStr?: string): Promise<{ locationName?: string } | { error: string }> {
    const lat = latStr ? Number(latStr) : undefined;
    const lng = lngStr ? Number(lngStr) : undefined;
    if (typeof lat !== 'number' || Number.isNaN(lat) || typeof lng !== 'number' || Number.isNaN(lng)) {
      return { error: 'Invalid coordinates' };
    }
    try {
      const googleKey = process.env.GOOGLE_MAPS_KEY;
      if (googleKey) {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${encodeURIComponent(googleKey)}`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData: any = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
            // Pick the most detailed result (first), extract city and area
            const components: any[] = gData.results[0].address_components || [];
            const get = (type: string) => components.find((c) => (c.types || []).includes(type))?.long_name;
            const city = get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1');
            const area = get('sublocality_level_1') || get('sublocality') || get('neighborhood');
            let locationName = city ? (area ? `${area}, ${city}` : city) : undefined;
            if (!locationName) {
              const district = get('administrative_area_level_2');
              const state = get('administrative_area_level_1');
              locationName = district || state;
            }
            if (!locationName && Array.isArray(gData.results)) {
              const name = (gData.results[0]?.formatted_address || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s && !/^\d+/.test(s))
                .slice(0, 2)
                .join(', ');
              if (name) locationName = name;
            }
            if (locationName) return { locationName };
          }
        }
        // If Google fails, fall through to Nominatim
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'sih-civic-local-dev/1.0 (contact@example.com)' } });
      if (!res.ok) return { error: 'Reverse geocoding failed' };
      const data = await res.json();
      const addr = data?.address || {};
      const city = addr.city || addr.town || addr.village;
      const ward = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
      let locationName = city ? (ward ? `${ward}, ${city}` : city) : undefined;
      if (!locationName) {
        const district = addr.city_district || addr.state_district || addr.county;
        const state = addr.state;
        locationName = district || state;
      }
      if (!locationName) {
        const parts = String(data.display_name || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s && !/^\d+/.test(s))
          .slice(0, 2);
        if (parts.length) locationName = parts.join(', ');
      }
      return { locationName };
    } catch {
      return { error: 'Reverse geocoding error' };
    }
  }
}


