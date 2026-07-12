import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { Loading, ErrorState } from "@/components/ui/states";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/providers/AuthProvider";
import { messageSchema } from "@/schemas/message";

export default function Thread() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const { data: messages, isLoading, isError, refetch } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages?.length]);

  const onSend = async () => {
    const parsed = messageSchema.safeParse({ body: text });
    if (!parsed.success) return;
    setText(""); // optimistic clear
    try {
      await send.mutateAsync(parsed.data.body);
    } catch {
      setText(parsed.data.body); // restore on failure
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      <View className="flex-row items-center border-b border-gray-100 px-4 py-2">
        <Pressable onPress={() => router.back()} className="pr-3">
          <Text className="text-forest text-base">‹ Inbox</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerClassName="px-4 py-4"
            renderItem={({ item }) => (
              <MessageBubble body={item.body} mine={item.sender_id === userId} createdAt={item.created_at} />
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          <View className="flex-row items-end gap-2 border-t border-gray-100 bg-white px-3 py-2 pb-6">
            <Input
              value={text}
              onChangeText={setText}
              placeholder="Message…"
              multiline
              className="flex-1"
              onSubmitEditing={onSend}
            />
            <Pressable
              onPress={onSend}
              disabled={!text.trim() || send.isPending}
              className={`h-11 w-11 items-center justify-center rounded-full ${text.trim() ? "bg-forest" : "bg-gray-300"}`}
            >
              <Text className="text-lg text-white">↑</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
