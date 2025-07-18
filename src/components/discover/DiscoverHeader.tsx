
interface DiscoverHeaderProps {
  currentUserGender: string | null;
  profilesCount: number;
  isLoading: boolean;
}

export const DiscoverHeader = ({ currentUserGender, profilesCount, isLoading }: DiscoverHeaderProps) => {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Discover</h1>
      <p className="text-gray-600">Find your perfect match</p>
      {!currentUserGender && (
        <p className="text-sm text-orange-600 mt-2">
          Set your gender in your profile to see targeted matches!
        </p>
      )}
      {profilesCount === 0 && !isLoading && (
        <p className="text-sm text-blue-600 mt-2">
          No more profiles to show. Check back later for new members!
        </p>
      )}
    </div>
  );
};
