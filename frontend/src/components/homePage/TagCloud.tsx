import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTagCloud } from "@/hooks/useTemplates";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { TagCloud } from "@/types";

// 👉 New type to include "count"
type TagWithCount = TagCloud & { count: number };

const TOP_TAGS_LIMIT = 20; // Show top 20 tags by default

export default function TagCloudSection() {
  const { t } = useTranslation("common");
  const { data: tags, isLoading, isError, refetch } = useTagCloud();
  const [showAllTags, setShowAllTags] = useState(false);

  const getTagSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return "text-base";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "text-2xl font-bold";
    if (ratio > 0.5) return "text-xl font-semibold";
    if (ratio > 0.25) return "text-lg";
    return "text-base";
  };

  if (isLoading) return <SmallSkeleton />;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{t("Failed to load tags. Please try again.")}</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
          {t("Retry")}
        </button>
      </div>
    );
  }

  // 👉 Use the new type
  const processedTags: TagWithCount[] = (Array.isArray(tags) ? tags : [])
    .filter((tag): tag is TagCloud => tag?.tagId !== undefined && tag?.tagName !== undefined && Array.isArray(tag.templateIds))
    .map((tag) => ({
      ...tag,
      count: tag.templateIds.length,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = processedTags[0]?.count || 1;
  const displayedTags = showAllTags ? processedTags : processedTags.slice(0, TOP_TAGS_LIMIT);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold my-7 text-center">{t("common.home.Explore_by_Tags")}</h1>

      <Card className="my-8">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 justify-center items-baseline">
            {displayedTags.map((tag) => (
              <Link
                key={tag.tagId}
                to={`/search?query=${encodeURIComponent(tag.tagName)}`}
                className={`
                  ${getTagSize(tag.count, maxCount)}
                  px-3 py-1 bg-secondary hover:bg-secondary-dark rounded-full 
                  transition-all duration-200 hover:scale-110
                  whitespace-nowrap
                `}
              >
                {tag.tagName}
                <span className="text-xs ml-1 opacity-80">({tag.count})</span>
              </Link>
            ))}
          </div>

          {processedTags.length > TOP_TAGS_LIMIT && (
            <div className="mt-6 text-center">
              <button onClick={() => setShowAllTags(!showAllTags)} className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark">
                {showAllTags ? t("Show Less") : t(`Show All (${processedTags.length})`)}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
