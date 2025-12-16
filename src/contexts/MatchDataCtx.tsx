import React, { createContext, useContext } from "react";
import type { Trio, Winner } from "../types";

// 実際のデータ登録関数に渡すデータの型
type MatchData = {
  first: Trio;
  second: Trio;
  winner: Winner;
  matchDate: number | null;
};

// Contextが提供する値の型
type MatchDataContextType = {
  // データ登録関数（未ロード時は何もしないダミー関数）
  onAddMatch: (data: MatchData) => void;
  // ローカル再読込関数（未ロード時は何もしないダミー関数）
  onSyncLocal: () => void;
  // データ処理がロードされ、利用可能かどうかのフラグ
  isDataReady: boolean;
};

// デフォルト値: データが未ロードの状態
const defaultContext: MatchDataContextType = {
  onAddMatch: () => console.warn("Data module not loaded yet."), // ダミー関数
  onSyncLocal: () => console.warn("Data module not loaded yet."), // ダミー関数
  isDataReady: false,
};

export const MatchDataContext =
  createContext<MatchDataContextType>(defaultContext);

export const useMatchData = () => useContext(MatchDataContext);
