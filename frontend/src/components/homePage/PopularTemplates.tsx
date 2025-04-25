import TemplateCardSimple from "@/components/templateShow/TemplateCardSimple";
import { usePopularTemplates } from "@/hooks/useTemplates";
import FourTemplatesSkeleton from "@/components/global/FourTemplatesSkeleton";

export default function PopularTemplatesSection() {
  const { data: templates, isLoading } = usePopularTemplates();

  if (isLoading) return <FourTemplatesSkeleton />;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">🔥 Popular Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.isArray(templates) && templates.map((template, i) => <TemplateCardSimple key={template.id} template={template} index={i} />)}</div>
    </section>
  );
}

//
