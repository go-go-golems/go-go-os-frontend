import type { ArtifactRecord } from './artifactsSlice';

interface ArtifactsStateShape {
  byId: Record<string, ArtifactRecord>;
}

interface ArtifactsStateSlice {
  hypercardArtifacts: ArtifactsStateShape;
}

export const selectArtifactsById = (state: ArtifactsStateSlice) => state.hypercardArtifacts.byId;

export const selectArtifactById = (state: ArtifactsStateSlice, artifactId: string): ArtifactRecord | undefined =>
  state.hypercardArtifacts.byId[artifactId];
