import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@constants/colors';
import { COLORS } from '@constants/colors';
import { startGoals } from '@services/goals/startGoal';
import { getMuseumHistory } from '@services/ChatGPT/history';
import { generateMuseumQuiz } from '@services/ChatGPT/quizz';
import { getCulturalObjectInfo } from '@services/culturalObject/getCulturalObjectInfo';
import AlbumItem from '@components/Album/AlbumItem';
import SearchByImageButton from '@components/ImageRecognition/SearchByImageButton';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { AlbumResponseDto } from '@interfaces/album/AlbumResponse';
import { useRoute } from '@react-navigation/native';

// Interfaz para los parámetros de navegación
interface AdventureRouteParams {
  museumId: number;
  museumLocation: {
    latitude: number;
    longitude: number;
    name: string;
  };
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  hasUserLocation: boolean;
}

interface AdventureStep {
  paragraph: string;
  culturalObject?: {
    name: string;
    id: number;
  };
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizResponse {
  museum: string;
  description: string;
  questions: QuizQuestion[];
}

export default function AdventureScreen() {
  const route = useRoute<any>();
  const params = route.params as AdventureRouteParams;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const [currentStep, setCurrentStep] = useState(0);
  const [adventureSteps, setAdventureSteps] = useState<AdventureStep[]>([]);
  const [goalId, setGoalId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCulturalObject, setCurrentCulturalObject] = useState<CulturalObjectResponse | null>(null);
  const [objectVerified, setObjectVerified] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);

  const startAdventure = async () => {
    try {
      setIsLoading(true);
      
      // Usar los parámetros recibidos de la navegación
      const museumId = params?.museumId || 1;
      let latitude = -12.13693; // Valor por defecto
      let longitude = -77.02326; // Valor por defecto
      
      // Si hay ubicación del usuario, usarla; si no, usar la del museo
      if (params?.hasUserLocation && params?.userLocation) {
        latitude = params.userLocation.latitude;
        longitude = params.userLocation.longitude;
        console.log('Iniciando aventura con ubicación del usuario:', { latitude, longitude });
      } else if (params?.museumLocation) {
        latitude = params.museumLocation.latitude;
        longitude = params.museumLocation.longitude;
        console.log('Iniciando aventura con ubicación del museo:', { latitude, longitude });
      } else {
        console.log('Iniciando aventura con ubicación por defecto:', { latitude, longitude });
      }
  
      const startedGoalId = await startGoals(museumId, latitude, longitude);
      setGoalId(startedGoalId);
      
      await getAdventureHistory(startedGoalId);
      
    } catch (error: any) {
      console.error('Error starting adventure:', error);
      Alert.alert('Error', 'No se pudo iniciar la aventura. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para mostrar información de ubicación
  const showLocationInfo = () => {
    if (!params) {
      Alert.alert('Información', 'No hay información de ubicación disponible.');
      return;
    }

    let message = `Museo: ${params.museumLocation?.name || 'No especificado'}\n`;
    message += `Ubicación del museo: ${params.museumLocation?.latitude?.toFixed(6)}, ${params.museumLocation?.longitude?.toFixed(6)}\n\n`;
    
    if (params.hasUserLocation && params.userLocation) {
      message += `Tu ubicación: ${params.userLocation.latitude.toFixed(6)}, ${params.userLocation.longitude.toFixed(6)}\n`;
      
      // Calcular distancia aproximada si ambas ubicaciones están disponibles
      if (params.museumLocation) {
        const distance = calculateDistance(
          params.userLocation.latitude,
          params.userLocation.longitude,
          params.museumLocation.latitude,
          params.museumLocation.longitude
        );
        message += `Distancia al museo: ${distance.toFixed(1)} km`;
      }
    } else {
      message += 'Tu ubicación: No disponible (permisos denegados)';
    }
    
    Alert.alert('Información de Ubicación', message, [{ text: 'Entendido' }]);
  };

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getAdventureHistory = async (goalId: number) => {
    try {
      const response = await getMuseumHistory(goalId);
      const historyText = response.data.reply;
      const steps = parseHistoryText(historyText);
      setAdventureSteps(steps);
      setCurrentStep(0);
      
    } catch (error: any) {
      console.error('Error getting adventure history:', error);
      Alert.alert('Error', 'No se pudo cargar la historia de la aventura.');
    }
  };

const parseHistoryText = (historyText: string): AdventureStep[] => {
  const paragraphs = historyText.split(/\n\n+/).map(p => p.trim()).filter(p => p);
  const steps: AdventureStep[] = [];

  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim();

    // Ignorar solo para mostrar el texto, pero guardar el culturalObject
    const objectOnlyMatch = /^(.+),\s*ID:\s*(\d+)$/i.exec(trimmed);
    if (objectOnlyMatch) {
      const lastStep = steps[steps.length - 1];
      if (lastStep) {
        lastStep.culturalObject = {
          name: objectOnlyMatch[1].trim(),
          id: parseInt(objectOnlyMatch[2], 10),
        };
      }
      return; // No añadimos texto nuevo
    }

    const step: AdventureStep = { paragraph: trimmed };

    // Buscar objetos dentro del párrafo
    const objectMatch = trimmed.match(/(.+?)\s*\(id:\s*(\d+)\)/i);
    if (objectMatch) {
      step.culturalObject = {
        name: objectMatch[1].trim(),
        id: parseInt(objectMatch[2], 10),
      };
    }

    steps.push(step);
  });

  return steps;
};


const handleNextStep = () => {
  if (currentStep < adventureSteps.length - 1) {
    setCurrentStep(currentStep + 1);
  } else {
    showQuizSection();
  }
};

  // Fetch cultural object details
  const fetchCulturalObject = async (objectId: number) => {
    try {
      const response = await getCulturalObjectInfo(objectId);
      setCurrentCulturalObject(response.data);
    } catch (error: any) {
      console.error('Error fetching cultural object:', error);
      Alert.alert('Error', 'No se pudo cargar la información del objeto cultural.');
    }
  };

  // Handle object verification success
  const handleObjectVerified = () => {
    setObjectVerified(true);
    Alert.alert('¡Objeto Verificado!', 'Has encontrado correctamente el objeto cultural. Continúa con la aventura.');
  };

  // Show quiz section
  const showQuizSection = async () => {
    try {
      if (!goalId) return;
      
      const response = await generateMuseumQuiz(goalId);
      const quizData = JSON.parse(response.data.reply);
      setQuizData(quizData);
      setShowQuiz(true);
      setUserAnswers(new Array(quizData.questions.length).fill(''));
      
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      Alert.alert('Error', 'No se pudo generar el cuestionario.');
    }
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Submit quiz
  const submitQuiz = () => {
    if (!quizData) return;
    
    const results = quizData.questions.map((question, index) => 
      userAnswers[index] === question.answer
    );
    
    setQuizResults(results);
    setQuizSubmitted(true);
  };

  // Reset adventure
  const resetAdventure = () => {
    setCurrentStep(0);
    setAdventureSteps([]);
    setGoalId(null);
    setCurrentCulturalObject(null);
    setObjectVerified(false);
    setShowQuiz(false);
    setQuizData(null);
    setUserAnswers([]);
    setQuizSubmitted(false);
    setQuizResults([]);
  };
  // useEffect para cargar el culturalObject automáticamente al cambiar de paso
useEffect(() => {
  const loadCulturalObject = async () => {
    const step = adventureSteps[currentStep];
    if (step?.culturalObject) {
      setObjectVerified(false);
      try {
        const response = await getCulturalObjectInfo(step.culturalObject.id);
        setCurrentCulturalObject(response.data);
      } catch (error) {
        console.error('Error fetching cultural object:', error);
      }
    } else {
      setCurrentCulturalObject(null);
    }
  };

  if (adventureSteps.length > 0) {
    loadCulturalObject();
  }
}, [currentStep, adventureSteps]);

  // Render adventure step
  const renderAdventureStep = () => {
    if (adventureSteps.length === 0) return null;
    
    const step = adventureSteps[currentStep];
    
    return (
      <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            Paso {currentStep + 1} de {adventureSteps.length}
          </Text>
          
          <Text style={[styles.stepText, { color: colors.text }]}>
            {step.paragraph}
          </Text>
          
          {step.culturalObject && currentCulturalObject && (
            <View style={styles.objectSection}>
              <Text style={[styles.objectTitle, { color: colors.text }]}>
                Objeto Cultural a Encontrar:
              </Text>
              
              <View style={styles.albumItemContainer}>
                <AlbumItem 
                  item={{
                    id: currentCulturalObject.id,
                    name: currentCulturalObject.name,
                    description: currentCulturalObject.description,
                    type: currentCulturalObject.type,
                    pictureUrls: currentCulturalObject.pictureUrls || [],
                    isObtained: false
                  } as AlbumResponseDto}
                  isObtained={false}
                />
              </View>
              
              {!objectVerified ? (
                <View style={styles.searchSection}>
                  <Text style={[styles.searchText, { color: colors.textSecondary }]}>
                    Usa la búsqueda por imagen para verificar este objeto:
                  </Text>
                  <SearchByImageButton
                    expectedObjectId={step.culturalObject.id}
                    similarityThreshold={0.75}
                    onObjectFound={handleObjectVerified}
                    onError={(error) => {
                      console.error('Error:', error);
                    }}
                    style={[styles.searchButton, { backgroundColor: COLORS.button.primary }]}
                  />
                </View>
              ) : (
                <View style={styles.verifiedSection}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  <Text style={[styles.verifiedText, { color: COLORS.success }]}>
                    ¡Objeto verificado correctamente!
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: COLORS.button.primary },
              (!step.culturalObject || objectVerified) && styles.nextButtonEnabled
            ]}
            onPress={handleNextStep}
            disabled={step.culturalObject && !objectVerified}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === adventureSteps.length - 1 ? 'Finalizar Aventura' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Render quiz
  const renderQuiz = () => {
    if (!quizData) return null;
    
    return (
      <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.quizTitle, { color: colors.text }]}>
            Cuestionario Final
          </Text>
          
          <Text style={[styles.museumInfo, { color: colors.textSecondary }]}>
            {quizData.museum}
          </Text>
          
          <Text style={[styles.museumDescription, { color: colors.text }]}>
            {quizData.description}
          </Text>
          
          {quizData.questions.map((question, questionIndex) => (
            <View key={questionIndex} style={styles.questionContainer}>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {question.question}
              </Text>
              
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionButton,
                    { borderColor: colors.border },
                    userAnswers[questionIndex] === option && { borderColor: COLORS.button.primary }
                  ]}
                  onPress={() => handleQuizAnswer(questionIndex, option)}
                  disabled={quizSubmitted}
                >
                  <Text style={[
                    styles.optionText,
                    { color: colors.text },
                    userAnswers[questionIndex] === option && { color: COLORS.button.primary }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {quizSubmitted && (
                <View style={styles.resultContainer}>
                  {quizResults[questionIndex] ? (
                    <View style={styles.correctAnswer}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={[styles.resultText, { color: COLORS.success }]}>
                        ¡Correcto!
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.incorrectAnswer}>
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                      <Text style={[styles.resultText, { color: COLORS.error }]}>
                        Incorrecto. Respuesta correcta: {question.answer}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
          
          {!quizSubmitted ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COLORS.button.primary },
                userAnswers.every(answer => answer !== '') && styles.submitButtonEnabled
              ]}
              onPress={submitQuiz}
              disabled={userAnswers.some(answer => answer === '')}
            >
              <Text style={styles.submitButtonText}>Enviar Respuestas</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.quizResults}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                Resultados del Cuestionario
              </Text>
              <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
                Respuestas correctas: {quizResults.filter(result => result).length} de {quizData.questions.length}
              </Text>
              
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: COLORS.primary }]}
                onPress={resetAdventure}
              >
                <Text style={styles.resetButtonText}>Nueva Aventura</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>
            Aventura Cultural
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Descubre objetos culturales a través de una emocionante aventura
          </Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Iniciando aventura...
            </Text>
          </View>
        ) : adventureSteps.length === 0 ? (
          <Card style={[styles.card, { backgroundColor: colors.cardBackground}]}>
            <View style={styles.cardContent}>
              <Ionicons 
                name="compass-outline" 
                size={64} 
                color={COLORS.primary} 
                style={styles.startIcon}
              />
              <Text style={[styles.startTitle, { color: colors.text }]}>
                ¿Listo para la Aventura?
              </Text>
              <Text style={[styles.startDescription, { color: colors.textSecondary }]}>
                Inicia una emocionante aventura cultural donde deberás encontrar objetos específicos usando reconocimiento de imagen.
              </Text>
              
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: COLORS.primary }]}
                onPress={startAdventure}
              >
                <Text style={styles.startButtonText}>Comenzar Aventura</Text>
              </TouchableOpacity>
              
              {/* Botón para mostrar información de ubicación */}
              {params && (
                <TouchableOpacity
                  style={[styles.infoButton, { borderColor: COLORS.black }]}
                  onPress={showLocationInfo}
                >
                  <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.infoButtonText, { color: colors.textSecondary }]}>
                    Ver información de ubicación
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ) : showQuiz ? (
          renderQuiz()
        ) : (
          renderAdventureStep()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: COLORS.black, 
    borderWidth: 1,   
  },
  cardContent: {
    padding: 20,
  },
  startIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  startDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'justify',
  },
  objectSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  objectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  albumItemContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  searchSection: {
    alignItems: 'center',
  },
  searchText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 200,
  },
  verifiedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  nextButtonEnabled: {
    opacity: 1,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  museumInfo: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  museumDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  correctAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incorrectAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  submitButtonEnabled: {
    opacity: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quizResults: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  resetButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  infoButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
}); 