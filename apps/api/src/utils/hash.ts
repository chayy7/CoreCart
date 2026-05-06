import bcrypt from "bcryptjs";

export const hashPassword = async (plain: string) => bcrypt.hash(plain, 12);
export const comparePassword = async (plain: string, hashed: string) => bcrypt.compare(plain, hashed);
