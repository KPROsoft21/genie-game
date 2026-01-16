import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Genie, { GenieState } from '@/components/Genie';
import MagicParticles from '@/components/MagicParticles';
import Colors from '@/constants/colors';

type Answer = 'yes' | 'no' | 'probably_yes' | 'probably_no' | 'dont_know';

interface QAHistoryItem {
  question: string;
  answer: Answer;
}

const responseSchema = z.object({
  type: z.enum(['question', 'guess']),
  content: z.string(),
  confidence: z.number().min(0).max(100),
});

const answerButtons: { value: Answer; label: string; color: string }[] = [
  { value: 'yes', label: 'Yes', color: Colors.success },
  { value: 'probably_yes', label: 'Probably Yes', color: '#86efac' },
  { value: 'dont_know', label: "Don't Know", color: Colors.textSecondary },
  { value: 'probably_no', label: 'Probably No', color: '#fca5a5' },
  { value: 'no', label: 'No', color: Colors.error },
];

export default function GameScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [genieState, setGenieState] = useState<GenieState>('idle');
  const [isGuessing, setIsGuessing] = useState(false);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [questionsSinceLastGuess, setQuestionsSinceLastGuess] = useState(0);
  const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const getCategoryContext = useCallback(() => {
    const contexts: Record<string, string> = {
      character: 'a real or fictional character (person, superhero, celebrity, historical figure, etc.)',
      animal: 'an animal (real or mythical creature)',
      object: 'an everyday object or thing',
      movie: 'a movie or TV show',
      music: 'a musician, singer, or band',
      game: 'a video game',
    };
    return contexts[category || 'character'] || 'something';
  }, [category]);

  const animateQuestion = useCallback(() => {
    questionAnim.setValue(0);
    Animated.timing(questionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [questionAnim]);

  const { mutate: generateQuestion } = useMutation({
    mutationFn: async (history: QAHistoryItem[]) => {
      const historyText = history.length > 0
        ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer.replace('_', ' ')}`).join('\n')
        : 'No questions asked yet.';

      const previousGuessesText = previousGuesses.length > 0
        ? `\n\nPrevious wrong guesses (DO NOT guess these again): ${previousGuesses.join(', ')}`
        : '';

      const canGuess = questionsSinceLastGuess >= 5 || (previousGuesses.length === 0 && history.length >= 5);
      const guessInstruction = canGuess
        ? '2. If you\'re confident enough and have strong evidence, make a guess'
        : `2. You MUST ask more questions before guessing (need ${5 - questionsSinceLastGuess} more questions)`;

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `You are a mind-reading genie playing a guessing game. The player is thinking of ${getCategoryContext()}.

Previous Q&A:
${historyText}${previousGuessesText}

Based on the answers so far (${history.length} questions asked), either:
1. Ask a strategic YES/NO question to narrow down what they're thinking of
${guessInstruction}

Rules:
- Questions must be answerable with yes/no/probably/don't know
- Be creative and strategic with questions
- Consider what common ${category || 'things'} fit the answers given
${!canGuess ? '- YOU MUST ASK A QUESTION, NOT GUESS' : '- Make confident guesses when evidence strongly points to something specific'}
- Never repeat a previous wrong guess

Respond with type "question" for a new question, or "guess" if you want to guess.
${!canGuess ? 'IMPORTANT: You MUST respond with type "question" - guessing is not allowed yet.' : ''}
Set confidence 0-100 based on how sure you are.`,
          },
        ],
        schema: responseSchema,
      });

      return result;
    },
  });

  const handleMutationSuccess = useCallback((data: z.infer<typeof responseSchema>) => {
    if (data.type === 'guess' && questionsSinceLastGuess >= 5) {
      setIsGuessing(true);
      setCurrentGuess(data.content);
      setConfidence(data.confidence);
      setGenieState('confident');
    } else {
      setCurrentQuestion(data.content);
      setGenieState('asking');
      animateQuestion();
    }
  }, [animateQuestion, questionsSinceLastGuess]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setGenieState('thinking');
      const timer = setTimeout(() => {
        generateQuestion([], {
          onSuccess: handleMutationSuccess,
          onError: (error) => {
            console.error('Error generating question:', error);
            setGenieState('idle');
          },
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [generateQuestion, handleMutationSuccess]);

  const handleAnswer = (answer: Answer) => {
    if (!currentQuestion) return;

    const newHistory: QAHistoryItem[] = [...qaHistory, { question: currentQuestion, answer }];
    setQaHistory(newHistory);
    setCurrentQuestion('');
    setGenieState('thinking');
    setQuestionsSinceLastGuess(prev => prev + 1);

    setTimeout(() => {
      generateQuestion(newHistory, {
        onSuccess: handleMutationSuccess,
        onError: (error) => {
          console.error('Error generating question:', error);
          setGenieState('idle');
        },
      });
    }, 1000);
  };

  const handleGuessResponse = (correct: boolean) => {
    setGuessCorrect(correct);
    if (correct) {
      setGenieState('celebrating');
      setGameOver(true);
    } else {
      if (currentGuess) {
        setPreviousGuesses(prev => [...prev, currentGuess]);
      }
      setIsGuessing(false);
      setCurrentGuess(null);
      setQuestionsSinceLastGuess(0);
      setGenieState('thinking');
      setTimeout(() => {
        generateQuestion(qaHistory, {
          onSuccess: handleMutationSuccess,
          onError: (error) => {
            console.error('Error generating question:', error);
            setGenieState('idle');
          },
        });
      }, 1000);
    }
  };

  const handlePlayAgain = () => {
    router.replace('/category');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <LinearGradient
      colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
      style={styles.gradient}
    >
      <MagicParticles />
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.genieSection}>
            <Genie state={genieState} size={160} />
            <View style={styles.questionCounter}>
              <Text style={styles.questionCounterText}>
                Question {qaHistory.length + 1}
              </Text>
            </View>
          </View>

          {gameOver && guessCorrect ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>I knew it! 🎉</Text>
              <Text style={styles.resultText}>
                It was <Text style={styles.guessHighlight}>{currentGuess}</Text>
              </Text>
              <Text style={styles.resultSubtext}>
                Guessed in {qaHistory.length} questions
              </Text>
              <View style={styles.resultButtons}>
                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={handlePlayAgain}
                  testID="play-again-button"
                >
                  <Text style={styles.playAgainText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.homeButton}
                  onPress={handleGoHome}
                  testID="home-button"
                >
                  <Text style={styles.homeButtonText}>Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isGuessing ? (
            <View style={styles.guessContainer}>
              <Text style={styles.guessLabel}>I think I know...</Text>
              <ScrollView 
                style={styles.guessScrollContainer}
                contentContainerStyle={styles.guessScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.guessText}>{currentGuess}</Text>
              </ScrollView>
              <View style={styles.confidenceBar}>
                <View
                  style={[styles.confidenceFill, { width: `${confidence}%` }]}
                />
              </View>
              <Text style={styles.confidenceText}>{confidence}% confident</Text>
              <Text style={styles.guessQuestion}>Am I right?</Text>
              <View style={styles.guessButtons}>
                <TouchableOpacity
                  style={[styles.guessButton, styles.guessYes]}
                  onPress={() => handleGuessResponse(true)}
                  testID="guess-yes"
                >
                  <Text style={styles.guessButtonText}>Yes!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.guessButton, styles.guessNo]}
                  onPress={() => handleGuessResponse(false)}
                  testID="guess-no"
                >
                  <Text style={styles.guessButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.questionContainer}>
              {genieState === 'thinking' ? (
                <View style={styles.thinkingContainer}>
                  <Text style={styles.thinkingText}>Hmm, let me think...</Text>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.questionBubble,
                    {
                      opacity: questionAnim,
                      transform: [
                        {
                          scale: questionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <ScrollView 
                    style={styles.questionBubbleScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <Text style={styles.questionText}>{currentQuestion}</Text>
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          )}

          {!gameOver && !isGuessing && genieState !== 'thinking' && (
            <View style={styles.answersContainer}>
              {answerButtons.map((btn) => (
                <TouchableOpacity
                  key={btn.value}
                  style={[styles.answerButton, { borderColor: btn.color }]}
                  onPress={() => handleAnswer(btn.value)}
                  testID={`answer-${btn.value}`}
                >
                  <Text style={[styles.answerText, { color: btn.color }]}>
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {qaHistory.length > 0 && !gameOver && (
            <ScrollView
              ref={scrollRef}
              style={styles.historyScroll}
              contentContainerStyle={styles.historyContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
            >
              {qaHistory.slice(-2).map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyQuestion} numberOfLines={1}>
                    {item.question}
                  </Text>
                  <Text style={styles.historyAnswer}>
                    {item.answer.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  genieSection: {
    alignItems: 'center',
    paddingTop: 10,
  },
  questionCounter: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  questionCounterText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    maxHeight: 180,
  },
  thinkingContainer: {
    alignItems: 'center',
  },
  thinkingText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontStyle: 'italic',
  },
  questionBubble: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    maxWidth: '100%',
    maxHeight: 160,
  },
  questionBubbleScroll: {
    flexGrow: 0,
  },
  questionText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 26,
  },
  answersContainer: {
    gap: 10,
    paddingBottom: 16,
  },
  answerButton: {
    backgroundColor: 'rgba(45, 27, 78, 0.6)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  answerText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  historyScroll: {
    maxHeight: 100,
    marginBottom: 10,
  },
  historyContainer: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyQuestion: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  historyAnswer: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  guessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  guessLabel: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontStyle: 'italic',
  },
  guessScrollContainer: {
    maxHeight: 120,
    flexGrow: 0,
  },
  guessScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  guessText: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center',
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  confidenceBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  confidenceText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  guessQuestion: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600' as const,
    marginTop: 16,
  },
  guessButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  guessButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  guessYes: {
    backgroundColor: Colors.success,
  },
  guessNo: {
    backgroundColor: Colors.error,
  },
  guessButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  resultText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  guessHighlight: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  resultSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  playAgainButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  playAgainText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  homeButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
