export class DenyIpAddressesRepository {
  constructor(private db: D1Database) { }
  
  public async exists(ipAddress: string): Promise<boolean> {
    const exists = await this.db.prepare('SELECT 1 FROM deny_ip_addresses WHERE ip_address = ? LIMIT 1').bind(ipAddress).first();
    return exists != null;
  }
}
