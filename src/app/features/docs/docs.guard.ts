import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateChildFn } from '@angular/router';
import { VersionService } from '../../shared/services/version.service';

export const docsChildGuard: CanActivateChildFn = (child) => {
	const router = inject(Router);
	const versionService = inject(VersionService);
	const since = child.data['since'] as string | undefined;

	if (since && !versionService.isVersionAtLeast(since)) {
		return router.parseUrl('/docs/overview');
	}

	return true;
};
