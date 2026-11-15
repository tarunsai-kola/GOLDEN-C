const ORG_ROLES = {
  OWNER: 'Owner',
  ADMINISTRATOR: 'Administrator',
  EDITOR: 'Editor',
  RECRUITER: 'Recruiter',
  EVENT_MANAGER: 'Event Manager',
  MEMBER: 'Member',
};

const ALL_ORG_ROLES = [
  ORG_ROLES.OWNER,
  ORG_ROLES.ADMINISTRATOR,
  ORG_ROLES.EDITOR,
  ORG_ROLES.RECRUITER,
  ORG_ROLES.EVENT_MANAGER,
  ORG_ROLES.MEMBER,
];

const ORG_TYPES = {
  COMPANY: 'company',
  COLLEGE: 'college',
  INCUBATOR: 'incubator',
  INVESTOR: 'investor',
  COMMUNITY: 'community',
  PARTNER: 'partner',
};

const ALL_ORG_TYPES = [
  ORG_TYPES.COMPANY,
  ORG_TYPES.COLLEGE,
  ORG_TYPES.INCUBATOR,
  ORG_TYPES.INVESTOR,
  ORG_TYPES.COMMUNITY,
  ORG_TYPES.PARTNER,
];

const ORG_STATUS = {
  ACTIVE: 'active',
  PENDING_VERIFICATION: 'pending_verification',
  SUSPENDED: 'suspended',
};

const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
};

module.exports = {
  ORG_ROLES,
  ALL_ORG_ROLES,
  ORG_TYPES,
  ALL_ORG_TYPES,
  ORG_STATUS,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
};
