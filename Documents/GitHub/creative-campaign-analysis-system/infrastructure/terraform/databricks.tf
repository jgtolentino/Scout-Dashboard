# Databricks Workspace
resource "azurerm_databricks_workspace" "creative_workspace" {
  name                = "dbw-creative-analysis"
  resource_group_name = azurerm_resource_group.creative_analysis.name
  location            = azurerm_resource_group.creative_analysis.location
  sku                 = "premium"
  
  custom_parameters {
    no_public_ip = true
    virtual_network_id = azurerm_virtual_network.creative_vnet.id
  }
}

# Medallion pipeline configuration
resource "databricks_job" "medallion_pipeline" {
  name = "Creative-ML-Pipeline"

  # Bronze: Raw data ingestion
  task {
    task_key = "ingest_raw"
    notebook_task {
      notebook_path = "/Shared/Pipelines/1_bronze_ingestion"
    }
    new_cluster {
      num_workers   = 2
      spark_version = "12.2.x-scala2.12"
      node_type_id  = "Standard_DS3_v2"
    }
  }

  # Silver: Feature engineering
  task {
    task_key = "process_silver"
    depends_on { task_key = "ingest_raw" }
    notebook_task {
      notebook_path = "/Shared/Pipelines/2_silver_processing"
    }
    new_cluster {
      num_workers   = 4
      spark_version = "12.2.x-scala2.12"
      node_type_id  = "Standard_DS3_v2"
    }
  }

  # Gold: Campaign insights
  task {
    task_key = "generate_insights"
    depends_on { task_key = "process_silver" }
    notebook_task {
      notebook_path = "/Shared/Pipelines/3_gold_insights"
    }
    new_cluster {
      num_workers   = 8
      spark_version = "12.2.x-scala2.12"
      node_type_id  = "Standard_DS4_v2"
    }
  }

  # ML: Model training
  task {
    task_key = "train_models"
    depends_on { task_key = "process_silver" }
    notebook_task {
      notebook_path = "/Shared/Pipelines/4_ml_training"
    }
    new_cluster {
      num_workers   = 4
      spark_version = "12.2.x-scala2.12"
      node_type_id  = "Standard_NC6s_v3"  # GPU-enabled
    }
  }
} 