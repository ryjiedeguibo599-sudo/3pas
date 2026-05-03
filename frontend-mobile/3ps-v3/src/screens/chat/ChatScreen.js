import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import API, { API_URL } from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen({ navigation, route }) {
  const { serviceType, serviceId, receiverId, title } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    let socket;
    (async () => {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        socket = io(API_URL);
        socketRef.current = socket;
        socket.emit('join', user.id);

        socket.on('receive_message', (msg) => {
          if (String(msg.service_id) === String(serviceId) && msg.service_type === serviceType) {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        });

        fetchMessages();
      }
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [serviceId]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/chat?service_type=${serviceType}&service_id=${serviceId}`);
      setMessages(res.data.messages || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !currentUser || !receiverId) return;

    const data = {
      sender_id: currentUser.id,
      receiver_id: receiverId,
      service_type: serviceType,
      service_id: serviceId,
      message: inputText.trim()
    };

    socketRef.current.emit('send_message', data);
    setInputText('');
  };

  const renderItem = ({ item }) => {
    const isMe = currentUser && item.sender_id === currentUser.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRight : styles.msgLeft]}>
        <View style={[styles.msgBubble, isMe ? styles.bgPrimary : styles.bgWhite]}>
          <Text style={[styles.msgText, isMe ? styles.textWhite : styles.textDark]}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Chat'}</Text>
      </View>
      
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { paddingRight: 15 },
  backText: { color: '#2563EB', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  container: { flex: 1 },
  listContent: { padding: 15, gap: 10 },
  msgRow: { flexDirection: 'row', marginBottom: 5 },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bgPrimary: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bgWhite: { backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  textWhite: { color: 'white', fontSize: 15 },
  textDark: { color: '#0F172A', fontSize: 15 },
  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, maxHeight: 100, fontSize: 15 },
  sendBtn: { marginLeft: 10, backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center' },
  sendText: { color: 'white', fontWeight: 'bold' }
});
