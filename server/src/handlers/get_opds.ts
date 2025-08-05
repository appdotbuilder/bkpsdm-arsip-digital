
import { db } from '../db';
import { opdsTable } from '../db/schema';
import { type OPD } from '../schema';

export const getOPDs = async (): Promise<OPD[]> => {
  try {
    const results = await db.select()
      .from(opdsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch OPDs:', error);
    throw error;
  }
};
