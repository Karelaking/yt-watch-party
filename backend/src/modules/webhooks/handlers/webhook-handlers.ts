import type { IUserRepository } from '../../users/repositories/user.repository.interface.js';
import type { IEventDispatcher } from '../../../core/events/index.js';
import { UserCreatedEvent } from '../../../core/events/index.js';

export interface ClerkWebhookPayload {
  data: {
    id: string;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    image_url?: string | null;
    profile_image_url?: string | null;
    deleted?: boolean;
    [key: string]: unknown;
  };
  type: string;
  object: string;
}

export interface IWebhookHandler {
  canHandle(eventType: string): boolean;
  handle(payload: ClerkWebhookPayload): Promise<string | null>; // returns userId if applicable
}

export class ClerkUserCreatedHandler implements IWebhookHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public canHandle(eventType: string): boolean {
    return eventType === 'user.created';
  }

  public async handle(payload: ClerkWebhookPayload): Promise<string | null> {
    const data = payload.data;
    const clerkUserId = data.id;

    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address || data.email_addresses?.[0]?.email_address || null;

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatarUrl = data.image_url || data.profile_image_url || null;

    const existing = await this.userRepository.findByClerkId(clerkUserId);
    if (existing) {
      await this.userRepository.update(existing.id, {
        email: primaryEmail,
        displayName: fullName || data.username || existing.displayName,
        avatarUrl: avatarUrl || existing.avatarUrl,
        username: data.username || existing.username,
        status: 'ACTIVE',
      });
      return existing.id;
    }

    const created = await this.userRepository.create({
      clerkUserId,
      email: primaryEmail,
      displayName: fullName || data.username || null,
      avatarUrl,
      username: data.username || null,
      status: 'ACTIVE',
    });

    this.eventDispatcher.publish(new UserCreatedEvent({
      userId: created.id,
      clerkUserId: created.clerkUserId,
      email: created.email,
    }));

    return created.id;
  }
}

export class ClerkUserUpdatedHandler implements IWebhookHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  public canHandle(eventType: string): boolean {
    return eventType === 'user.updated';
  }

  public async handle(payload: ClerkWebhookPayload): Promise<string | null> {
    const data = payload.data;
    const clerkUserId = data.id;

    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address || data.email_addresses?.[0]?.email_address || null;

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const avatarUrl = data.image_url || data.profile_image_url || null;

    const user = await this.userRepository.findByClerkId(clerkUserId);
    if (!user) {
      // If user wasn't in DB yet, create them
      const created = await this.userRepository.create({
        clerkUserId,
        email: primaryEmail,
        displayName: fullName || data.username || null,
        avatarUrl,
        username: data.username || null,
        status: 'ACTIVE',
      });
      return created.id;
    }

    await this.userRepository.update(user.id, {
      email: primaryEmail,
      displayName: fullName || data.username || user.displayName,
      avatarUrl: avatarUrl || user.avatarUrl,
      username: data.username || user.username,
    });

    return user.id;
  }
}

export class ClerkUserDeletedHandler implements IWebhookHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  public canHandle(eventType: string): boolean {
    return eventType === 'user.deleted';
  }

  public async handle(payload: ClerkWebhookPayload): Promise<string | null> {
    const data = payload.data;
    const clerkUserId = data.id;

    const user = await this.userRepository.findByClerkId(clerkUserId);
    if (user) {
      await this.userRepository.delete(user.id);
      return user.id;
    }
    return null;
  }
}
