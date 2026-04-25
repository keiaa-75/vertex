import { writable } from 'svelte/store';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export interface Lesson {
    id: string; // Firestore document ID (for tracking)
    topicId: string;
    title: string;
    order: number;
    googleSitesUrl: string;
    prerequisites: string[];
}

export interface Topic {
    id: string;
    name: string;
    order: number;
    lessons: Lesson[];
}

export interface CurriculumState {
    topics: Topic[];
    loading: boolean;
}

const initialState: CurriculumState = { topics: [], loading: true };
const { subscribe, set } = writable<CurriculumState>(initialState);

export const curriculumStore = { subscribe };

/**
 * Fetches the full curriculum from Firestore.
 * Structure: curriculum/precalculus/topics/{topicId}/lessons/{lessonId}
 * Public rad, no auth guard required per security rules.
 */
export async function loadCurriculum(): Promise<void> {
    console.log('Curriculum: Starting fetch, setting loading=true');
    set({ ...initialState, loading: true });

    try {
        // Fetch topics ordered by display order
        const topicsRef = collection(db, 'curriculum', 'precalculus', 'topics');
        const topicsSnap = await getDocs(query(topicsRef, orderBy('order')));

        console.log('Curriculum: Fetched', topicsSnap.size, 'topics');

        const topics: Topic[] = [];

        for (const topicDoc of topicsSnap.docs) {
            const lessonsRef = collection(
                db,
                'curriculum',
                'precalculus',
                'topics',
                topicDoc.id,
                'lessons'
            );
            const lessonsSnap = await getDocs(query(lessonsRef, orderBy('order')));

            const lessons: Lesson[] = lessonsSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                topicId: (data.topicId as string) || topicDoc.id,
                title: data.title as string,
                order: data.order as number,
                googleSitesUrl: data.googleSitesUrl as string,
                prerequisites: (data.prerequisites as string[]) || []
              };
            });

            topics.push({
                id: topicDoc.id,
                name: topicDoc.data().name,
                order: topicDoc.data().order,
                lessons
            });
        }

        console.log('Curriculum: Setting loading=false, topics=', topics.length);
        set({ topics, loading: false });
    } catch (err) {
        console.error('Failed to load curriculum:', err);
        set({ topics: [], loading: false });
    }
}

/**
 * Utility: Builds a flat map of lessonId -> Lesson for prerequisite hint generation
 */
export function buildLessonMap(topics: Topic[]): Map<string, Lesson> {
    const map = new Map<string, Lesson>();
    for (const topic of topics) {
        for (const lesson of topic.lessons) {
            map.set(lesson.id, lesson);
        }
    }
    return map;
}