import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { WebView } from 'react-native-webview'
import { StyleSheet, View } from 'react-native'

/**
 * OSMMap — drop-in replacement for react-native-maps MapView using OpenStreetMap
 *
 * Props:
 *   region          { latitude, longitude, latitudeDelta, longitudeDelta }
 *   markers         [{ id, latitude, longitude, title, color }]
 *   onPress         (coordinate) => void           — fires on map tap
 *   onMarkerPress   (markerId) => void
 *   showsUserLocation  boolean
 *   userLocation    { latitude, longitude }       — pass current GPS to show blue dot
 *   polyline        [{ latitude, longitude }, …]  — optional route line
 *   style           View style
 *
 * Imperative methods (via ref):
 *   animateToRegion({ latitude, longitude, zoom })
 */

const buildHtml = (region, markers, polyline, userLocation, showsUserLocation) => {
  const center = `[${region.latitude}, ${region.longitude}]`
  const zoom   = region.latitudeDelta ? Math.max(8, Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta)))) : 14

  const markersJs = (markers || []).map(m => `
    L.marker([${m.latitude}, ${m.longitude}], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:${m.color || '#2563EB'};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(map).on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: '${m.id || ''}' }));
    })${m.title ? `.bindPopup('${String(m.title).replace(/'/g, "\\'")}')` : ''};
  `).join('\n')

  const polylineJs = polyline && polyline.length > 1
    ? `L.polyline([${polyline.map(p => `[${p.latitude}, ${p.longitude}]`).join(',')}], { color: '#2563EB', weight: 5, opacity: 0.8 }).addTo(map);`
    : ''

  const userLocJs = (showsUserLocation && userLocation) ? `
    L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
      radius: 8,
      fillColor: '#2563EB',
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(map);
  ` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView(${center}, ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    ${markersJs}
    ${polylineJs}
    ${userLocJs}

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'press',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      }));
    });

    // Listen for commands from React Native
    document.addEventListener('message', function(e) {
      try {
        var cmd = JSON.parse(e.data);
        if (cmd.type === 'animateTo') {
          map.flyTo([cmd.latitude, cmd.longitude], cmd.zoom || map.getZoom(), { duration: 1 });
        }
      } catch (err) {}
    });
    window.addEventListener('message', function(e) {
      try {
        var cmd = JSON.parse(e.data);
        if (cmd.type === 'animateTo') {
          map.flyTo([cmd.latitude, cmd.longitude], cmd.zoom || map.getZoom(), { duration: 1 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`
}

const OSMMap = forwardRef(({
  region, markers, polyline, userLocation,
  showsUserLocation = false, onPress, onMarkerPress, style,
}, ref) => {
  const webRef = useRef(null)

  useImperativeHandle(ref, () => ({
    animateToRegion: (target) => {
      const msg = JSON.stringify({
        type: 'animateTo',
        latitude:  target.latitude,
        longitude: target.longitude,
        zoom:      target.zoom,
      })
      webRef.current?.postMessage(msg)
    },
  }))

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'press' && onPress) {
        onPress({ latitude: data.latitude, longitude: data.longitude })
      } else if (data.type === 'marker' && onMarkerPress) {
        onMarkerPress(data.id)
      }
    } catch {}
  }

  if (!region) return <View style={[styles.container, style]} />

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: buildHtml(region, markers, polyline, userLocation, showsUserLocation) }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview:   { flex: 1, backgroundColor: 'transparent' },
})

export default OSMMap
