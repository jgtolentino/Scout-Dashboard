import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Sidebar from '../components/Sidebar';
import ProjectCard from '../components/ProjectCard';
import SearchBar from '../components/SearchBar';
import CreateProjectModal from '../components/CreateProjectModal';
import EmptyState from '../components/EmptyState';
import { useNotification } from '../hooks/useNotification';
import { sortProjects } from '../utils/projectHelpers';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const auth = getAuth();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProjects(user.uid);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);
  
  const fetchProjects = async (userId) => {
    try {
      setIsLoading(true);
      
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const projectsData = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification('Failed to load projects', 'error');
      setIsLoading(false);
    }
  };
  
  // Filter and sort projects when dependencies change
  useEffect(() => {
    let result = [...projects];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(project => project.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        project =>
          project.name.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Apply sorting
    result = sortProjects(result, sortBy);
    
    setFilteredProjects(result);
  }, [projects, searchTerm, sortBy, selectedCategory]);
  
  const handleCreateProject = (projectData) => {
    // Logic to create a new project will be handled by the modal
    setShowCreateModal(false);
    // Navigate to the editor for the new project
    navigate(`/editor/${projectData.id}`);
  };
  
  const handleProjectClick = (projectId) => {
    navigate(`/editor/${projectId}`);
  };
  
  const getProjectCategories = () => {
    const categories = new Set(projects.map(project => project.category).filter(Boolean));
    return ['all', ...Array.from(categories)];
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>My Projects</h1>
          <button 
            className="create-project-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create New Project
          </button>
        </header>
        
        <div className="dashboard-tools">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search projects..."
          />
          
          <div className="filter-sort-container">
            <div className="category-filter">
              <label htmlFor="category">Category:</label>
              <select 
                id="category" 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {getProjectCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-by">
              <label htmlFor="sortBy">Sort by:</label>
              <select 
                id="sortBy" 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastUpdated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="nameAsc">Name (A-Z)</option>
                <option value="nameDesc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-projects">
            <div className="spinner"></div>
            <p>Loading your projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title={
              searchTerm || selectedCategory !== 'all'
                ? "No matching projects found"
                : "No projects yet"
            }
            description={
              searchTerm || selectedCategory !== 'all'
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"
            }
            actionText="Create New Project"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
};

export default Dashboard;