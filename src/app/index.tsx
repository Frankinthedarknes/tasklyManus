import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import Swiper from "react-native-deck-swiper";
import {
  fetchNearbyServices,
  NEARBY_RADIUS_KM,
  type NearbyService,
} from "../lib/services";

export default function SwipeScreen() {
  const [cards, setCards] = useState<NearbyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCardIndex(0);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 40.7128;
      let lng = -74.006;

      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      setCoords({ lat, lng });
      const nearby = await fetchNearbyServices(lat, lng, NEARBY_RADIUS_KM);
      setCards(nearby);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar los servicios.";
      setError(message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Servicios cerca" }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#38bdf8" size="large" />
          <Text style={styles.muted}>Buscando servicios a {NEARBY_RADIUS_KM} km…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.button} onPress={() => void loadServices()}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : cards.length === 0 || cardIndex >= cards.length ? (
        <View style={styles.center}>
          <Text style={styles.title}>No hay más servicios a {NEARBY_RADIUS_KM} km</Text>
          {coords ? (
            <Text style={styles.muted}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </Text>
          ) : null}
          <Pressable style={styles.button} onPress={() => void loadServices()}>
            <Text style={styles.buttonText}>Actualizar</Text>
          </Pressable>
        </View>
      ) : (
        <Swiper
          cards={cards}
          cardIndex={cardIndex}
          stackSize={3}
          backgroundColor="transparent"
          cardVerticalMargin={48}
          cardHorizontalMargin={16}
          disableTopSwipe
          disableBottomSwipe
          onSwiped={() => setCardIndex((index) => index + 1)}
          onSwipedAll={() => setCardIndex(cards.length)}
          renderCard={(card) =>
            card ? (
              <View style={styles.card}>
                <Text style={styles.price}>{card.taskly_price} Tasklys</Text>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.body}>{card.description ?? "Sin descripción"}</Text>
                <Text style={styles.muted}>
                  {card.distance_km.toFixed(2)} km · {card.status}
                </Text>
              </View>
            ) : (
              <View style={styles.card} />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  muted: {
    color: "#94a3b8",
    textAlign: "center",
  },
  error: {
    color: "#fda4af",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#38bdf8",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  card: {
    flex: 0.72,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#1e293b",
    justifyContent: "flex-end",
    gap: 8,
  },
  price: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 22,
  },
});
