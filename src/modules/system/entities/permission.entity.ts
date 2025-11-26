/**
 * Permission Entity - Domain model
 */
export class Permission {
  readonly id: number;
  readonly code: string;
  readonly resource: string;
  readonly action: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: number;
    code: string;
    resource: string;
    action: string;
    displayName: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.code = props.code;
    this.resource = props.resource;
    this.action = props.action;
    this.displayName = props.displayName;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Check if permission matches a pattern (supports wildcards)
   */
  matches(pattern: string): boolean {
    if (pattern === '*.*' || pattern === this.code) {
      return true;
    }

    const [patternResource, patternAction] = pattern.split('.');

    if (patternResource === '*') {
      return patternAction === '*' || this.action === patternAction;
    }

    if (patternAction === '*') {
      return this.resource === patternResource;
    }

    return false;
  }
}

