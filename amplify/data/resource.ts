
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Activity: a
    .model({
      internId: a.string().required(),
      date: a.date().required(),
      hours: a.float().required(),
      category: a.string(),
      description: a.string().required(),
      qualityScore: a.float(),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),
    
  Intern: a
    .model({
      name: a.string().required(),
      internId: a.string().required(),
      email: a.string().required(),
      joiningDate: a.date(),
    })
    .authorization((allow) => [allow.authenticated()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
