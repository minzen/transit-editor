import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemText, Divider, useMediaQuery, useTheme } from '@mui/material'

type Props = {
    open: boolean
    onClose: () => void
}

export function HelpDialog({ open, onClose }: Props) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
            <DialogTitle>Transit Map Editor - User Guide</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Getting Started</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        The Transit Map Editor is a browser-based tool for creating schematic transit maps with octolinear (45° and 90°) routing.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Tools</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Select Tool"
                                secondary="Click a station to select it (blue ring). Hold Shift and click to multi-select. Drag selected stations to move them. Press Delete or Backspace to delete all selected. Double-click a station to rename it. Right-click a station for a context menu with rename, delete, and label position options."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Station Tool"
                                secondary="Click anywhere on the canvas to create a new station. Stations snap to the grid and to octolinear angles from nearby stations."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Segment Tool"
                                secondary="Click a station to start a segment, then click another station to connect them. Segments snap to octolinear angles. Double-click a segment path to add a bend point; double-click an existing bend point to remove it. Drag bend points to adjust the route."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Shape Tool"
                                secondary="Click on the canvas to place polygon vertices. Double-click to finalize the shape, or press Escape to cancel. Press Backspace or Delete to undo the last placed point. Click a finished shape to select it, then drag the white vertex handles to edit. Press Delete or Escape to deselect or remove a selected shape."
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Creating Lines</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        When using the Segment tool, select a line from the dropdown before creating segments. To create a new line:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="1. Click the '+ Line' button"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="2. Enter a name and optional short code (e.g. 'U1')"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="3. Choose a line style (solid, dashed, double) and transit mode (metro, rail, tram, bus, ferry)"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="4. Select a color from the palette or enter a custom hex code (e.g., #ff00ff)"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="5. Click 'Create' to add the line"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Keyboard Shortcuts</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Ctrl+Z / Cmd+Z"
                                secondary="Undo last action"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Ctrl+Y / Cmd+Shift+Z"
                                secondary="Redo last action"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Delete / Backspace"
                                secondary="Delete selected stations, segments, or shapes"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Escape"
                                secondary="Cancel shape drawing, deselect shape, or cancel rename dialog"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Space (hold) + drag"
                                secondary="Pan the canvas"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Shift + click"
                                secondary="Multi-select stations"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Backspace / Delete (during shape drawing)"
                                secondary="Remove the last placed shape point"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Double-click"
                                secondary="Rename station, add bend point to segment, or finalize a shape"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>View Controls</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Zoom In (+)"
                                secondary="Click the Zoom In button or scroll up with the mouse wheel. Zoom centers on the cursor position."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Zoom Out (-)"
                                secondary="Click the Zoom Out button or scroll down with the mouse wheel. Zoom centers on the cursor position."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Reset View"
                                secondary="Click the Reset View button to return to the default zoom level and center the viewport."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Pan"
                                secondary="Hold Space and drag, or hold the middle mouse button and drag."
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Export</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Use the 'Export SVG' button to save your map as a vector file, or 'Export PNG' to save as a raster image. SVG exports are compatible with external editors like Gimp and Inkscape.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Background Image</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Load a background image (e.g., a city map) to help with positioning. Toggle visibility with the 'Show/Hide BG' button.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Auto-save</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        The editor automatically saves your work to your browser's local storage. Your stations, segments, lines, and active tool are saved automatically and will be restored when you return to the editor.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Note: The undo/redo history and viewport position are not saved between sessions.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Grid Size</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Adjust the grid size for more precise station placement. Range: 10-100.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Line Width</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Customize the thickness of lines on your map. Range: 1-20 pixels. Default: 10 pixels.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box>
                    <Typography variant="h6" gutterBottom>Tips</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="• Use the mouse wheel to zoom in and out; hold Space to pan"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Stations and bend points snap to octolinear angles (0°, 45°, 90°, etc.) for clean, professional-looking maps"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Hold Shift and click stations to select multiple at once for batch operations"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Double-click a segment path to insert a bend point for fine-grained routing control"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Select a line in the toolbar to dim everything else and trace its route easily"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Use the Shape tool with low opacity to add water, parks, or land backgrounds behind your transit network"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Right-click a station to quickly adjust its label position when names overlap"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Assign line codes (e.g. 'M1', 'A') so small coloured badges appear next to stations, like real transit maps"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• SVG exports work with external editors like Gimp and Inkscape for further editing"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Use undo/redo frequently to experiment with different layouts"
                            />
                        </ListItem>
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
