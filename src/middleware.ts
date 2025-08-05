import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', 
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/api/webhooks/clerk',
  '/api/invitations/validate(.*)',
  '/join(.*)'
]);

// Add the onboarding route to the list of public routes for now
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
]);


export default clerkMiddleware((auth, req) => {
  // Protect all routes that are not public
  if (!isPublicRoute(req) && !isOnboardingRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};