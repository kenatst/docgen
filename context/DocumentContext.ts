import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { GeneratedDocument } from "@/constants/types";

const STORAGE_KEY = "docgen_history";

export const [DocumentProvider, useDocuments] = createContextHook(() => {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["document_history"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as GeneratedDocument[]) : [];
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  const { mutate: saveMutate } = useMutation({
    mutationFn: async (docs: GeneratedDocument[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
      return docs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_history"] });
    },
  });

  const addDocument = useCallback(
    (doc: GeneratedDocument) => {
      const updated = [doc, ...history];
      setHistory(updated);
      saveMutate(updated);
    },
    [history, saveMutate]
  );

  const removeDocument = useCallback(
    (id: string) => {
      const updated = history.filter((d) => d.id !== id);
      setHistory(updated);
      saveMutate(updated);
    },
    [history, saveMutate]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveMutate([]);
  }, [saveMutate]);

  return {
    history,
    addDocument,
    removeDocument,
    clearHistory,
    isLoading: historyQuery.isLoading,
  };
});
