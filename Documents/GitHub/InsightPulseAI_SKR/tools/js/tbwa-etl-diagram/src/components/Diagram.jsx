import React from "react";
import LayerCard from "./LayerCard";
import Connector from "./Connector";
import {
  DataFactory,
  EventHub,
  Database as BlobStorage
} from "@fluentui/react-icons";

const ORCHESTRATION = [
  { id: "df", title: "Data Factory", icon: DataFactory, type: "batch" },
  { id: "eh", title: "Event Hubs", icon: EventHub, type: "stream" },
  { id: "bs", title: "Blob Storage", icon: BlobStorage, type: "batch" }
];

const LAYERS = [
  {
    id: "raw",
    title: "Raw Ingestion",
    color: "tbwa-yellow",
    icon: BlobStorage,
    desc: "Delta Live Tables ingestion",
  },
  {
    id: "staging",
    title: "Staging & Cleansing",
    color: "tbwa-slate",
    icon: EventHub,
    desc: "Data quality checks & CDC",
  },
  {
    id: "curation",
    title: "Curated Business Tables",
    color: "tbwa-red",
    icon: DataFactory,
    desc: "Aggregations & feature store",
  },
  {
    id: "features",
    title: "Feature Store & RAG",
    color: "tbwa-blue",
    icon: EventHub,
    desc: "GenAI enrichment",
  },
  {
    id: "bi",
    title: "Dashboard & BI",
    color: "tbwa-gray",
    icon: BlobStorage,
    desc: "Power BI–style UI",
  }
];

export default function Diagram() {
  return (
    <div className="p-6 space-y-8">
      {/* Orchestration Row */}
      <div className="flex items-center justify-center gap-8">
        {ORCHESTRATION.map((node, index) => (
          <React.Fragment key={node.id}>
            <LayerCard {...node} />
            {index < ORCHESTRATION.length - 1 && <Connector to="raw" type={node.type} />}
          </React.Fragment>
        ))}
      </div>

      {/* ETL Layers */}
      <div className="flex items-start justify-center gap-12">
        {LAYERS.map((layer) => (
          <LayerCard key={layer.id} {...layer} />
        ))}
      </div>
    </div>
  );
}