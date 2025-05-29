
import { Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReviewsListProps {
  productId: string;
}

const ReviewsList = ({ productId }: ReviewsListProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles!product_reviews_user_id_fkey(full_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['product-stats', productId],
    queryFn: async () => {
      const { data: avgData, error: avgError } = await supabase
        .rpc('get_product_average_rating', { product_uuid: productId });
      
      const { data: countData, error: countError } = await supabase
        .rpc('get_product_review_count', { product_uuid: productId });

      if (avgError || countError) throw avgError || countError;
      
      return {
        averageRating: parseFloat(avgData || '0'),
        totalReviews: countData || 0,
      };
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.averageRating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {review.profiles?.full_name || 'Anonymous User'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Verified Purchase
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm font-medium text-gray-700">
                  {review.rating}/5
                </span>
              </div>

              {review.review_text && (
                <p className="text-gray-700 leading-relaxed">
                  {review.review_text}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No reviews yet</p>
            <p className="text-sm text-gray-500">Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;
