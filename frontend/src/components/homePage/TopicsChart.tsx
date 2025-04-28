import { useTranslation } from "react-i18next";
import { useTopicsData } from "@/hooks/useTemplates";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Topic = {
  topicId: number;
  topicName: string;
  templateCount: number;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF", "#FF6B6B", "#4FD1C5", "#F687B3"];

export default function TopicsPieChartSection() {
  const { t } = useTranslation("common");
  const { data: topicsData, isLoading, isError, refetch } = useTopicsData();

  if (isLoading) return <SmallSkeleton />;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{t("Failed to load topics. Please try again.")}</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
          {t("Retry")}
        </button>
      </div>
    );
  }

  const chartData = (Array.isArray(topicsData) ? topicsData : [])
    .filter((topic): topic is Topic => typeof topic === "object" && topic !== null && "topicId" in topic && "topicName" in topic && "templateCount" in topic)
    .map((topic) => ({
      name: topic.topicName,
      value: topic.templateCount,
      id: topic.topicId,
    }))
    .filter((item) => item.value > 0);

  // This function renders label *inside* each pie slice
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} style={{ pointerEvents: "none" }}>
        {name}
        {/* Optionally add percent */}
        {/* {" "}{(percent * 100).toFixed(0)}% */}
      </text>
    );
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold my-7 text-center">{t("common.home.Templates_by_Topic")}</h1>

      <Card className="my-8">
        <CardContent className="p-1">
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={150} fill="#8884d8" dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const topic = chartData.find((item) => item.name === name);
                    return [`${topic?.value || value} templates`, name];
                  }}
                  contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value) => {
                    const dataPoint = chartData.find((item) => item.name === value);
                    return (
                      <span className="text-sm text-foreground">
                        {value} ({dataPoint?.value || 0})
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
