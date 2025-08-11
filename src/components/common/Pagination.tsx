import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@constants/colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements: number;
  pageSize: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize
}) => {
  if (totalPages <= 1) return null;

  const startElement = currentPage * pageSize + 1;
  const endElement = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si hay pocas
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con lógica inteligente
      if (currentPage <= 2) {
        // Al inicio: mostrar primeras páginas + última
        for (let i = 0; i < 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Separador
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // Al final: mostrar primera + últimas páginas
        pages.push(0);
        pages.push(-1); // Separador
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En medio: mostrar página actual + contexto
        pages.push(0);
        pages.push(-1); // Separador
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Separador
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Mostrando {startElement}-{endElement} de {totalElements} elementos
      </Text>
      
      <View style={styles.paginationContainer}>
        {/* Botón Anterior */}
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 0 && styles.disabledButton
          ]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <Text style={[
            styles.pageButtonText,
            currentPage === 0 && styles.disabledButtonText
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Números de página */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === -1 ? (
              <Text style={styles.separator}>...</Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  currentPage === page && styles.activePageButton
                ]}
                onPress={() => onPageChange(page)}
              >
                <Text style={[
                  styles.pageButtonText,
                  currentPage === page && styles.activePageButtonText
                ]}>
                  {page + 1}
                </Text>
              </TouchableOpacity>
            )}
          </React.Fragment>
        ))}

        {/* Botón Siguiente */}
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages - 1 && styles.disabledButton
          ]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
        >
          <Text style={[
            styles.pageButtonText,
            currentPage === totalPages - 1 && styles.disabledButtonText
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 1,
  },
  activePageButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  activePageButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: COLORS.text,
    opacity: 0.5,
  },
  separator: {
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: 8,
    opacity: 0.7,
  },
});

export default Pagination; 