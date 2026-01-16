import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Cat, Package, Film, Music, Gamepad2 } from 'lucide-react-native';
import MagicParticles from '@/components/MagicParticles';
import Colors from '@/constants/colors';

const categories = [
  { id: 'character', name: 'Character', description: 'Real or fictional person', icon: User },
  { id: 'animal', name: 'Animal', description: 'Any creature big or small', icon: Cat },
  { id: 'object', name: 'Object', description: 'Things around you', icon: Package },
  { id: 'movie', name: 'Movie/Show', description: 'Films or TV series', icon: Film },
  { id: 'music', name: 'Musician/Band', description: 'Artists or groups', icon: Music },
  { id: 'game', name: 'Video Game', description: 'Any game ever made', icon: Gamepad2 },
];

export default function CategoryScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(categories.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    categories.forEach((_, index) => {
      Animated.timing(cardAnims[index], {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, cardAnims]);

  const handleSelectCategory = (categoryId: string) => {
    router.push({ pathname: '/game', params: { category: categoryId } });
  };

  return (
    <LinearGradient
      colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
      style={styles.gradient}
    >
      <MagicParticles />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>What are you thinking of?</Text>
          <Text style={styles.subtitle}>Choose a category to begin</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Animated.View
                key={category.id}
                style={[
                  styles.categoryCardWrapper,
                  {
                    opacity: cardAnims[index],
                    transform: [
                      {
                        translateY: cardAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(category.id)}
                  activeOpacity={0.8}
                  testID={`category-${category.id}`}
                >
                  <View style={styles.iconContainer}>
                    <Icon size={28} color={Colors.accent} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  categoryCardWrapper: {
    width: '100%',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
