/**
 * BaseService - Clase base para todos los servicios
 * Proporciona funcionalidades comunes para interactuar con Firestore
 */

import { Firestore, collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';

export class BaseService {
  protected db: Firestore;
  protected collectionName: string;

  constructor(db: Firestore, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Obtiene una referencia a una colección
   * @param name - Nombre de la colección
   * @param id - ID opcional del documento padre
   * @returns CollectionReference
   */
  protected getCollectionPath(name: string, id?: string): CollectionReference {
    if (id) {
      // Si se proporciona un ID, crea una subcolección
      return collection(this.db, this.collectionName, id, name);
    }
    // Si no, retorna la colección principal
    return collection(this.db, name);
  }

  /**
   * Obtiene una referencia a un documento
   * @param name - Nombre de la colección
   * @param id - ID del documento
   * @returns DocumentReference
   */
  protected getDocRef(name: string, id: string): DocumentReference {
    return doc(this.db, name, id);
  }
}
