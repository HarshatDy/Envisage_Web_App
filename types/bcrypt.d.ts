declare module 'bcrypt' {
  /**
   * Generate a salt
   * @param rounds Number of rounds to use, defaults to 10
   * @param callback Callback receiving the error, if any, and the generated salt
   */
  export function genSalt(rounds?: number, callback?: (err: Error | null, salt: string) => void): Promise<string>;

  /**
   * Hash the data using the given salt
   * @param data The data to be hashed
   * @param saltOrRounds The salt to be used, or the number of rounds to generate a salt
   * @param callback Callback receiving the error, if any, and the hashed data
   */
  export function hash(data: string, saltOrRounds: string | number, callback?: (err: Error | null, hash: string) => void): Promise<string>;

  /**
   * Compare the data with the hash
   * @param data The data to be compared
   * @param hash The hash to be compared with
   * @param callback Callback receiving the error, if any, and the comparison result
   */
  export function compare(data: string, hash: string, callback?: (err: Error | null, same: boolean) => void): Promise<boolean>;
}
