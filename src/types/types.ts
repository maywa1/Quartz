export interface PDF {
  id: number
  name: string
  file_name: string
  page_count?: number
  file_size?: number
  last_opened?: string
  created_at: string
}

export interface Note {
  id: number
  name: string
  file_name: string
  view_later: boolean
  pdf_coordinate_x?: number
  pdf_coordinate_y?: number
  pdf_page?: number
  pdf_id?: number
  tags?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color?: string
  created_at: string
}

export interface Statistics {
  totalPdfs: number
  totalNotes: number
  viewLaterCount: number
  recentlyOpenedPdfs: PDF[]
}

