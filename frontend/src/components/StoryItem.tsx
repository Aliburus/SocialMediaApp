import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '../types';

interface StoryItemProps {
  story: Story;
  onPress?: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        {!story.isViewed ? (
          <LinearGradient
            colors={['#E91E63', '#F06292', '#FF9800']}
            style={styles.gradient}
          >
            <View style={styles.innerBorder}>
              <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.viewedBorder}>
            <Image source={{ uri: story.user.avatar }} style={styles.avatar} />
          </View>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {story.user.username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  imageContainer: {
    marginBottom: 4,
  },
  gradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewedBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  username: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
});

export default StoryItem;