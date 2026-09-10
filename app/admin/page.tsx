import { redirect } from 'next/navigation';

/**
 * The editor opens on the pages of the site, not on a dashboard of
 * collections. "Which page do I want to change?" is the question every
 * editing session actually starts with.
 */
export default function AdminHome() {
  redirect('/admin/pages/');
}
