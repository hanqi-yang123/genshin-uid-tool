import axios from 'axios';
import {
  AnalysisData,
  BaseResponse,
  CharacterOption,
  DictCharacterFull,
  DictWeaponFull,
  GlobalCharacterStats,
  GlobalPlayerStats,
  HistoryItem,
  PlayerData,
  SessionInfo,
} from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSessionInfo = async (uid: string): Promise<BaseResponse<SessionInfo>> => {
  const response = await api.get<BaseResponse<SessionInfo>>(`/session/${uid}`);
  return response.data;
};

export const fetchUIDData = async (uid: string, viewerUid: string): Promise<BaseResponse<PlayerData>> => {
  const response = await api.post<BaseResponse<PlayerData>>('/fetch-uid', { uid, viewer_uid: viewerUid });
  return response.data;
};

export const refreshUIDData = async (uid: string, viewerUid: string): Promise<BaseResponse<PlayerData>> => {
  const response = await api.post<BaseResponse<PlayerData>>(`/refresh/${uid}`, null, {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const getPlayerData = async (uid: string, viewerUid: string): Promise<BaseResponse<PlayerData>> => {
  const response = await api.get<BaseResponse<PlayerData>>(`/player/${uid}`, {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const getHistory = async (viewerUid: string): Promise<BaseResponse<HistoryItem[]>> => {
  const response = await api.get<BaseResponse<HistoryItem[]>>('/history', {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const getAnalysis = async (uid: string, viewerUid: string): Promise<BaseResponse<AnalysisData>> => {
  const response = await api.get<BaseResponse<AnalysisData>>(`/analysis/${uid}`, {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const grantAdmin = async (viewerUid: string, targetUid: string): Promise<BaseResponse<{ UID: string }>> => {
  const response = await api.post<BaseResponse<{ UID: string }>>('/admin/grant-admin', {
    viewer_uid: viewerUid,
    target_uid: targetUid,
  });
  return response.data;
};

export const getGlobalPlayerStats = async (viewerUid: string): Promise<BaseResponse<GlobalPlayerStats>> => {
  const response = await api.get<BaseResponse<GlobalPlayerStats>>('/admin/player-stats', {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const getCharacterOptions = async (viewerUid: string): Promise<BaseResponse<CharacterOption[]>> => {
  const response = await api.get<BaseResponse<CharacterOption[]>>('/admin/character-options', {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

export const getGlobalCharacterStats = async (
  viewerUid: string,
  characterId: string,
): Promise<BaseResponse<GlobalCharacterStats>> => {
  const response = await api.get<BaseResponse<GlobalCharacterStats>>(`/admin/character-stats/${characterId}`, {
    params: { viewer_uid: viewerUid },
  });
  return response.data;
};

// ── admin CRUD API ──

export const adminDeletePlayer = async (viewerUid: string, targetUid: string): Promise<BaseResponse> => {
  const response = await api.post<BaseResponse>('/admin/delete-player', { viewer_uid: viewerUid, target_uid: targetUid });
  return response.data;
};

export const adminSaveCharacter = async (data: Record<string, unknown>): Promise<BaseResponse> => {
  const response = await api.post<BaseResponse>('/admin/character', data);
  return response.data;
};

export const adminDeleteCharacter = async (viewerUid: string, uid: string, 角色ID: string): Promise<BaseResponse> => {
  const response = await api.delete<BaseResponse>('/admin/character', { data: { viewer_uid: viewerUid, uid, 角色ID } });
  return response.data;
};

export const adminSaveWeapon = async (data: Record<string, unknown>): Promise<BaseResponse> => {
  const response = await api.post<BaseResponse>('/admin/weapon', data);
  return response.data;
};

export const adminDeleteWeapon = async (viewerUid: string, uid: string, 角色ID: string): Promise<BaseResponse> => {
  const response = await api.delete<BaseResponse>('/admin/weapon', { data: { viewer_uid: viewerUid, uid, 角色ID } });
  return response.data;
};

export const adminSaveRelic = async (data: Record<string, unknown>): Promise<BaseResponse> => {
  const response = await api.post<BaseResponse>('/admin/relic', data);
  return response.data;
};

export const adminDeleteRelic = async (viewerUid: string, uid: string, 角色ID: string, 部位: string): Promise<BaseResponse> => {
  const response = await api.delete<BaseResponse>('/admin/relic', { data: { viewer_uid: viewerUid, uid, 角色ID, 部位 } });
  return response.data;
};

export const adminGetDictCharacters = async (viewerUid: string): Promise<BaseResponse<DictCharacterFull[]>> => {
  const response = await api.get<BaseResponse<DictCharacterFull[]>>('/admin/dict/characters', { params: { viewer_uid: viewerUid } });
  return response.data;
};

export const adminGetDictWeapons = async (viewerUid: string): Promise<BaseResponse<DictWeaponFull[]>> => {
  const response = await api.get<BaseResponse<DictWeaponFull[]>>('/admin/dict/weapons', { params: { viewer_uid: viewerUid } });
  return response.data;
};

export const adminGetDictRelicSets = async (viewerUid: string): Promise<BaseResponse<string[]>> => {
  const response = await api.get<BaseResponse<string[]>>('/admin/dict/relic-sets', { params: { viewer_uid: viewerUid } });
  return response.data;
};

export const adminGetDictPropNames = async (viewerUid: string): Promise<BaseResponse<string[]>> => {
  const response = await api.get<BaseResponse<string[]>>('/admin/dict/prop-names', { params: { viewer_uid: viewerUid } });
  return response.data;
};

export const adminGetDictWeaponSubstats = async (viewerUid: string): Promise<BaseResponse<string[]>> => {
  const response = await api.get<BaseResponse<string[]>>('/admin/dict/weapon-substats', { params: { viewer_uid: viewerUid } });
  return response.data;
};
