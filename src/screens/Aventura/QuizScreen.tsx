import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import { generateMuseumQuiz } from '@services/Gemma/generateMuseumQuiz';
import { useToast } from '@hooks/useToast';
import Toast from '@components/common/Toast';

interface QuizRouteParams {
  museumId: number;
  museumName: string;
  goalId: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  museum: string;
  description: string;
  questions: QuizQuestion[];
}

export default function QuizScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as QuizRouteParams;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { toast, showCelebration, showError, hideToast } = useToast();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      const response = await generateMuseumQuiz(params.goalId);
      
      // Parsear la respuesta JSON del string
      const jsonMatch = response.data.reply.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('Formato de respuesta inválido');
      }
      
      const parsedData: QuizData = JSON.parse(jsonMatch[1]);
      setQuizData(parsedData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      showError('No se pudo cargar el cuestionario');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return; // Ya se respondió
    setSelectedAnswer(answer);
    const isCorrect = answer === quizData!.questions[currentQuestionIndex].answer;
    setIsAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
    } else {
      // Quiz completado
      setQuizCompleted(true);
      const finalScore = selectedAnswer === quizData!.questions[currentQuestionIndex].answer ? score + 1 : score;
      const percentage = Math.round((finalScore / quizData!.questions.length) * 100);
      
      if (percentage >= 80) {
        showCelebration(`¡Excelente! Obtuviste ${finalScore}/${quizData!.questions.length} puntos`);
      } else if (percentage >= 60) {
        showCelebration(`¡Bien hecho! Obtuviste ${finalScore}/${quizData!.questions.length} puntos`);
      } else {
        showCelebration(`¡Sigue practicando! Obtuviste ${finalScore}/${quizData!.questions.length} puntos`);
      }
    }
  };

  const handleFinishQuiz = () => {
    // Redirigir al HomeScreen después de completar el quiz
    navigation.navigate('Main' as never);
  };

  // Eliminado handleRetryQuiz - solo se permite salir

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonBackground} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Generando cuestionario...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quizData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            No se pudo cargar el cuestionario
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.buttonBackground }]}
            onPress={loadQuiz}
          >
            <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Cuestionario
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {quizCompleted ? (
        // Pantalla de resultados
        <View style={styles.resultsContainer}>
          <View style={[styles.resultsCard, { backgroundColor: COLORS.primary }]}>
            <View style={[styles.resultsContent, { backgroundColor: COLORS.white }]}>
              <Ionicons name="trophy" size={64} color={COLORS.primary} />
              <Text style={[styles.resultsTitle, { color: COLORS.primary }]}>¡Cuestionario Completado!</Text>
              
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreText, { color: COLORS.primary }]}>
                  {selectedAnswer === quizData.questions[currentQuestionIndex].answer ? score + 1 : score}
                  <Text style={[styles.scoreTotal, { color: COLORS.gray[600] }]}>/{quizData.questions.length}</Text>
                </Text>
                <Text style={[styles.scoreLabel, { color: COLORS.gray[600] }]}>puntos</Text>
              </View>

              <Text style={[styles.museumName, { color: COLORS.text }]}>{quizData.museum}</Text>
              <Text style={[styles.museumDescription, { color: COLORS.gray[600] }]}>{quizData.description}</Text>

              <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: COLORS.primary }]}
                onPress={handleFinishQuiz}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={20} color={COLORS.white} />
                <Text style={styles.finishButtonText}>Volver al Inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // Pantalla de pregunta
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: COLORS.gray[200] }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: COLORS.primary, width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: COLORS.gray[600] }]}>
              {currentQuestionIndex + 1} de {quizData.questions.length}
            </Text>
          </View>

          {/* Question Card */}
          <View style={[styles.questionCard, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}>
            <View style={styles.questionHeader}>
              <Ionicons name="help-circle" size={24} color={COLORS.primary} />
              <Text style={[styles.questionNumber, { color: COLORS.primary }]}>
                Pregunta {currentQuestionIndex + 1}
              </Text>
            </View>
            
            <Text style={[styles.questionText, { color: COLORS.text }]}>
              {currentQuestion.question}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { backgroundColor: COLORS.white, borderColor: COLORS.gray[300] },
                  selectedAnswer === option && isAnswerCorrect === true && styles.correctOption,
                  selectedAnswer === option && isAnswerCorrect === false && styles.incorrectOption,
                  selectedAnswer !== null && option === currentQuestion.answer && styles.correctAnswer,
                ]}
                onPress={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLetter, { color: COLORS.gray[600] }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={[
                    styles.optionText,
                    { color: COLORS.text },
                    selectedAnswer === option && styles.selectedOptionText,
                  ]}>
                    {option}
                  </Text>
                </View>
                
                {selectedAnswer === option && (
                  <Ionicons
                    name={isAnswerCorrect ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={isAnswerCorrect ? COLORS.success : COLORS.error}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Next Button */}
          {selectedAnswer !== null && (
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: COLORS.primary },
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleNextQuestion}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextButtonText, { color: COLORS.white }]}>
                {currentQuestionIndex < quizData.questions.length - 1 ? 'Siguiente' : 'Finalizar'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', maxWidth: '70%', textAlign: 'center' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  content: { flex: 1, paddingHorizontal: 16 },

  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },

  questionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },

  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  correctOption: {
    backgroundColor: COLORS.green[50],
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: COLORS.red[50],
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  correctAnswer: {
    backgroundColor: COLORS.green[50],
    borderColor: COLORS.success,
    borderWidth: 2,
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },

  resultsContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  resultsCard: {
    borderRadius: 20,
    padding: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultsContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreTotal: {
    fontSize: 24,
  },
  scoreLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  museumName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  museumDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  finishButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
