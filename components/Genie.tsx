import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';

export type GenieState = 'idle' | 'thinking' | 'asking' | 'celebrating' | 'confident';

interface GenieProps {
  state: GenieState;
  size?: number;
}

export default function Genie({ state, size = 200 }: GenieProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const thinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, glowAnim]);

  useEffect(() => {
    if (state === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(thinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(thinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (state === 'celebrating') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
      thinkAnim.setValue(0);
    }
  }, [state, scaleAnim, thinkAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const thinkRotate = thinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const getMouthPath = () => {
    switch (state) {
      case 'thinking':
        return "M 40,68 Q 50,64 60,68";
      case 'celebrating':
        return "M 35,65 Q 50,78 65,65";
      case 'confident':
        return "M 38,66 Q 50,76 62,66";
      case 'asking':
        return "M 42,68 Q 50,74 58,68";
      default:
        return "M 40,66 Q 50,73 60,66";
    }
  };

  const getEyeProps = () => {
    if (state === 'thinking') {
      return { scaleY: 0.3, offsetY: 2 };
    }
    if (state === 'celebrating') {
      return { scaleY: 0.2, offsetY: 0 };
    }
    return { scaleY: 1, offsetY: 0 };
  };

  const eyeProps = getEyeProps();

  return (
    <View style={[styles.container, { width: size, height: size * 1.2 }]}>
      <Animated.View
        style={[
          styles.glowOuter,
          {
            opacity: glowAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: 'rgba(79, 195, 247, 0.3)',
          },
        ]}
      />
      <Animated.View
        style={[
          styles.genieWrapper,
          {
            transform: [
              { translateY },
              { scale: scaleAnim },
              { rotate: state === 'thinking' ? thinkRotate : '0deg' },
            ],
          },
        ]}
      >
        <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
          <Defs>
            <RadialGradient id="smokeGrad" cx="50%" cy="0%" rx="50%" ry="100%">
              <Stop offset="0%" stopColor={Colors.genie.skin} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={Colors.genie.smoke} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <G>
            <Path
              d="M 40,82 Q 35,95 30,105 Q 40,115 50,118 Q 60,115 70,105 Q 65,95 60,82"
              fill="url(#smokeGrad)"
            />
            <Path
              d="M 35,90 Q 30,100 28,110 Q 35,115 45,116"
              fill={Colors.genie.smoke}
              opacity={0.4}
            />
            <Path
              d="M 65,90 Q 70,100 72,110 Q 65,115 55,116"
              fill={Colors.genie.smoke}
              opacity={0.4}
            />
            <Ellipse cx="50" cy="115" rx="20" ry="5" fill={Colors.genie.smokeDark} opacity={0.3} />
          </G>

          <G>
            <Ellipse cx="50" cy="55" rx="26" ry="30" fill={Colors.genie.skin} />
            <Ellipse cx="50" cy="57" rx="24" ry="28" fill={Colors.genie.skinLight} opacity={0.3} />
          </G>

          <G>
            <Path
              d="M 18,50 Q 15,45 18,40 Q 23,42 26,48"
              fill={Colors.genie.skin}
            />
            <Circle cx="16" cy="48" r="3" fill={Colors.genie.earring} />
            <Circle cx="16" cy="48" r="1.5" fill={Colors.accentLight} />
          </G>
          <G>
            <Path
              d="M 82,50 Q 85,45 82,40 Q 77,42 74,48"
              fill={Colors.genie.skin}
            />
            <Circle cx="84" cy="48" r="3" fill={Colors.genie.earring} />
            <Circle cx="84" cy="48" r="1.5" fill={Colors.accentLight} />
          </G>

          <G>
            <Path
              d="M 25,40 Q 30,18 50,15 Q 70,18 75,40 Q 70,35 50,33 Q 30,35 25,40"
              fill={Colors.genie.turban}
            />
            <Path
              d="M 28,38 Q 32,22 50,19 Q 68,22 72,38 Q 65,34 50,32 Q 35,34 28,38"
              fill="#9c27b0"
              opacity={0.6}
            />
            <Path
              d="M 42,25 Q 50,20 58,25 Q 55,28 50,27 Q 45,28 42,25"
              fill={Colors.genie.turban}
            />
            <Ellipse cx="50" cy="28" rx="6" ry="5" fill={Colors.genie.turbanGold} />
            <Circle cx="50" cy="28" r="3" fill={Colors.genie.turbanGem} />
            <Circle cx="51" cy="27" r="1" fill="#f48fb1" />
            <Path
              d="M 50,18 Q 52,10 48,5"
              stroke={Colors.genie.turbanGold}
              strokeWidth="2"
              fill="none"
            />
            <Circle cx="48" cy="5" r="2" fill={Colors.genie.turbanGem} />
          </G>

          <G transform={`translate(0, ${eyeProps.offsetY}) scale(1, ${eyeProps.scaleY})`}>
            <Ellipse cx="38" cy="50" rx="6" ry="7" fill="white" />
            <Ellipse cx="62" cy="50" rx="6" ry="7" fill="white" />
            <Circle cx="38" cy="50" r="3.5" fill="#1a0a2e" />
            <Circle cx="62" cy="50" r="3.5" fill="#1a0a2e" />
            <Circle cx="40" cy="48" r="1.5" fill="white" />
            <Circle cx="64" cy="48" r="1.5" fill="white" />
          </G>

          <Path
            d="M 30,45 Q 38,42 46,45"
            stroke={Colors.genie.skinDark}
            strokeWidth="2.5"
            fill="none"
          />
          <Path
            d="M 54,45 Q 62,42 70,45"
            stroke={Colors.genie.skinDark}
            strokeWidth="2.5"
            fill="none"
          />

          <Path
            d="M 47,58 Q 50,60 53,58"
            fill={Colors.genie.skinDark}
          />
          <Ellipse cx="50" cy="59" rx="2" ry="1" fill={Colors.genie.skinDark} opacity={0.5} />

          <Path
            d={getMouthPath()}
            stroke={Colors.genie.beard}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          <G>
            <Path
              d="M 35,72 Q 30,80 28,90 Q 35,92 42,88 Q 40,80 38,74"
              fill={Colors.genie.beard}
            />
            <Path
              d="M 65,72 Q 70,80 72,90 Q 65,92 58,88 Q 60,80 62,74"
              fill={Colors.genie.beard}
            />
            <Path
              d="M 38,74 Q 44,82 50,85 Q 56,82 62,74 Q 56,78 50,80 Q 44,78 38,74"
              fill={Colors.genie.beard}
            />
            <Path
              d="M 42,80 Q 50,95 58,80"
              fill={Colors.genie.beard}
            />
            <Path
              d="M 46,82 Q 50,100 54,82"
              fill="#283593"
              opacity={0.6}
            />
          </G>

          <G>
            <Path
              d="M 28,65 Q 22,70 20,80"
              stroke={Colors.genie.skin}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 72,65 Q 78,70 80,80"
              stroke={Colors.genie.skin}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx="20" cy="80" r="4" fill={Colors.genie.skin} />
            <Circle cx="80" cy="80" r="4" fill={Colors.genie.skin} />
            <Circle cx="22" cy="78" r="3" fill={Colors.genie.earring} />
            <Circle cx="78" cy="78" r="3" fill={Colors.genie.earring} />
          </G>

          {state === 'thinking' && (
            <G>
              <Circle cx="82" cy="28" r="4" fill={Colors.accent} opacity={0.8} />
              <Circle cx="88" cy="20" r="3" fill={Colors.accent} opacity={0.6} />
              <Circle cx="92" cy="14" r="2" fill={Colors.accent} opacity={0.4} />
            </G>
          )}

          {state === 'celebrating' && (
            <G>
              <Circle cx="15" cy="30" r="3" fill={Colors.accent} />
              <Circle cx="85" cy="30" r="3" fill={Colors.accent} />
              <Circle cx="10" cy="45" r="2" fill={Colors.glowLight} />
              <Circle cx="90" cy="45" r="2" fill={Colors.glowLight} />
              <Path
                d="M 46,12 L 48,6 L 50,12 L 52,6 L 54,12"
                stroke={Colors.accent}
                strokeWidth="2"
                fill="none"
              />
            </G>
          )}

          {state === 'confident' && (
            <G>
              <Path
                d="M 30,32 Q 35,29 40,32"
                stroke={Colors.accent}
                strokeWidth="2"
                fill="none"
                opacity={0.6}
              />
              <Path
                d="M 60,32 Q 65,29 70,32"
                stroke={Colors.accent}
                strokeWidth="2"
                fill="none"
                opacity={0.6}
              />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    opacity: 0.2,
  },
});
