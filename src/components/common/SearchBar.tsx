import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@constants/colors';

interface SearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  initialValue?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  onClear,
  initialValue = '',
  debounceMs = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearchRef.current(searchQuery);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [searchQuery, debounceMs]);

  const handleClear = () => {
    setSearchQuery('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.black,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: COLORS.text, paddingVertical: 0 },
  clearButton: { padding: 8, marginLeft: 8 },
  clearButtonText: { fontSize: 16, color: COLORS.text, opacity: 0.6 },
});

export default SearchBar;
