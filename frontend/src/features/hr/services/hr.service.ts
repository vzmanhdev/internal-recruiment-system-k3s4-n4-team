import { apiRequest } from "@/lib/api-client";

export interface Department { id:number; name:string; code:string; parent_id:number|null; sort_order:number; is_active:boolean; }
export interface JobTitle { id:number; name:string; department_id:number|null; level:string; min_salary:number; max_salary:number; description?:string; is_active:boolean; }
export interface Competency { id:number; name:string; category:string; description?:string; required_level:number; sort_order:number; is_active:boolean; }
export interface SharedCategory { id:number; category_type:string; name:string; sort_order:number; is_active:boolean; }

export const hrService = {
  departments:()=>apiRequest<Department[]>("/hr/departments"),
  createDepartment:(payload:Omit<Department,"id"|"is_active">)=>apiRequest<Department>("/hr/departments",{method:"POST",body:JSON.stringify(payload)}),
  jobTitles:()=>apiRequest<JobTitle[]>("/hr/job-titles"),
  createJobTitle:(payload:Omit<JobTitle,"id"|"is_active">)=>apiRequest<JobTitle>("/hr/job-titles",{method:"POST",body:JSON.stringify(payload)}),
  competencies:()=>apiRequest<Competency[]>("/hr/competencies"),
  createCompetency:(payload:Omit<Competency,"id"|"is_active">)=>apiRequest<Competency>("/hr/competencies",{method:"POST",body:JSON.stringify(payload)}),
  categories:()=>apiRequest<SharedCategory[]>("/hr/categories"),
  createCategory:(payload:Omit<SharedCategory,"id"|"is_active">)=>apiRequest<SharedCategory>("/hr/categories",{method:"POST",body:JSON.stringify(payload)}),
  reorderCategories:(ids:number[])=>apiRequest<SharedCategory[]>("/hr/categories/reorder",{method:"PUT",body:JSON.stringify({ids})}),
};
