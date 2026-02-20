/**
 * TagService - Servicio de gestion de etiquetas
 * Maneja etiquetas globales por usuario
 */

import { BaseService } from './base.service';
import {
  addDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

const normalizeTagName = (value: string) =>
  value
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const slugifyTag = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

export class TagService extends BaseService {
  private static instance: TagService;

  private constructor(db: any) {
    super(db, 'projects');
  }

  public static getInstance(db: any): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService(db);
    }
    return TagService.instance;
  }

  public async getTagsByProject(projectId: string): Promise<Tag[]> {
    try {
      const tagsRef = this.getCollectionPath('tags', projectId);
      const snapshot = await getDocs(tagsRef);
      const tags: Tag[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        tags.push({
          id: doc.id,
          name: data.name,
          slug: data.slug,
        });
      });

      return tags.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      console.error('Error al obtener tags:', error);
      throw new Error(`Error al obtener tags: ${error.message}`);
    }
  }

  public async getOrCreateTagsByName(projectId: string, names: string[]): Promise<Tag[]> {
    const normalizedNames = names
      .map((name) => normalizeTagName(name))
      .filter(Boolean);

    if (normalizedNames.length === 0) {
      return [];
    }

    const requested = Array.from(new Set(normalizedNames));
    const requestedMap = new Map(
      requested.map((name) => [slugifyTag(name), name] as const)
    );

    const existing = await this.getTagsByProject(projectId);
    const existingBySlug = new Map(existing.map((tag) => [tag.slug, tag] as const));

    const results: Tag[] = [];

    for (const [slug, name] of requestedMap.entries()) {
      const existingTag = existingBySlug.get(slug);
      if (existingTag) {
        results.push(existingTag);
        continue;
      }

      const tagData = {
        name,
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.getCollectionPath('tags', projectId), tagData);
      results.push({
        id: docRef.id,
        name,
        slug,
      });
    }

    return results;
  }
}
