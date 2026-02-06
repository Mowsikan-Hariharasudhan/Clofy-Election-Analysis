import Papa from 'papaparse';
import type { ElectionResult } from '../types/election';

export const parseCSV = (url: string): Promise<ElectionResult[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                resolve(results.data as ElectionResult[]);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
};
